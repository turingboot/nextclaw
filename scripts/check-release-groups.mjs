import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

const ROOT_DIR = process.cwd();
const WORKSPACE_ROOTS = ["packages", "apps", "workers"];
const CHANGESET_DIR = join(ROOT_DIR, ".changeset");

const collectPackageJsonFiles = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true });
  const packageFiles = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      packageFiles.push(...collectPackageJsonFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name === "package.json") {
      packageFiles.push(entryPath);
    }
  }
  return packageFiles;
};

const readPendingChangesetPackages = () => {
  const entries = readdirSync(CHANGESET_DIR, { withFileTypes: true });
  const packages = new Set();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    const content = readFileSync(join(CHANGESET_DIR, entry.name), "utf8");
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      continue;
    }
    for (const line of match[1].split("\n")) {
      const trimmed = line.trim();
      const packageMatch = trimmed.match(/^["']?([^"']+)["']?\s*:\s*(major|minor|patch)\s*$/);
      if (packageMatch) {
        packages.add(packageMatch[1]);
      }
    }
  }
  return packages;
};

const pendingChangesetPackages = readPendingChangesetPackages();

const isMeaningfulReleaseDrift = (packageDir, changedFile) => {
  const relativePath = relative(packageDir, changedFile).replaceAll("\\", "/");
  if (!relativePath || relativePath.startsWith("..")) {
    return false;
  }
  const fileName = basename(relativePath);
  if (fileName === "README.md" || fileName === "CHANGELOG.md") {
    return false;
  }
  if (/\.(test|spec)\.[^.]+$/.test(fileName)) {
    return false;
  }
  return true;
};

const findUnpublishedPackageDrift = (pkg) => {
  if (pendingChangesetPackages.has(pkg.name)) {
    return null;
  }
  const tagName = `${pkg.name}@${pkg.version}`;
  try {
    execFileSync("git", ["rev-parse", "--verify", `refs/tags/${tagName}`], {
      cwd: ROOT_DIR,
      stdio: "ignore"
    });
  } catch {
    return null;
  }

  const changedFiles = execFileSync(
    "git",
    ["diff", "--name-only", `${tagName}..HEAD`, "--", pkg.packageDir],
    {
      cwd: ROOT_DIR,
      encoding: "utf8"
    }
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => isMeaningfulReleaseDrift(pkg.absolutePackageDir, join(ROOT_DIR, file)));

  if (changedFiles.length === 0) {
    return null;
  }

  return {
    packageName: pkg.name,
    version: pkg.version,
    tagName,
    changedFiles
  };
};

const workspacePackages = WORKSPACE_ROOTS.flatMap((workspaceRoot) => {
  const absoluteWorkspaceRoot = join(ROOT_DIR, workspaceRoot);
  return collectPackageJsonFiles(absoluteWorkspaceRoot)
    .map((packageFile) => {
      const pkg = JSON.parse(readFileSync(packageFile, "utf8"));
      const packageDir = packageFile.replace(/package\.json$/, "").replace(/\/$/, "");
      const relativePackageFile = relative(ROOT_DIR, packageFile).replaceAll("\\", "/");
      const relativePackageDir = relative(ROOT_DIR, packageDir).replaceAll("\\", "/");
      if (pkg.private !== false) {
        return {
          private: true,
          packageFile: relativePackageFile,
          absolutePackageDir: packageDir,
          packageDir: relativePackageDir,
          pkg
        };
      }
      const expectedCommand = `node ${relative(
        packageFile.replace(/package\.json$/, ""),
        join(ROOT_DIR, "scripts", "ensure-pnpm-publish.mjs")
      ).replaceAll("\\", "/")}`;
      const actualCommand = pkg.scripts?.prepublishOnly;
      if (actualCommand === expectedCommand) {
        return {
          private: false,
          packageFile: relativePackageFile,
          absolutePackageDir: packageDir,
          packageDir: relativePackageDir,
          pkg
        };
      }
      return {
        private: false,
        packageFile: relative(ROOT_DIR, packageFile).replaceAll("\\", "/"),
        absolutePackageDir: packageDir,
        packageDir: relativePackageDir,
        pkg,
        expectedCommand,
        actualCommand: typeof actualCommand === "string" ? actualCommand : null
      };
    })
    .filter(Boolean);
});

const publishGuardFailures = workspacePackages
  .filter((entry) => entry.private === false && "expectedCommand" in entry)
  .map((entry) => ({
    packageFile: entry.packageFile,
    expectedCommand: entry.expectedCommand,
    actualCommand: entry.actualCommand
  }));

if (publishGuardFailures.length > 0) {
  console.error("Publish guard check failed.");
  for (const failure of publishGuardFailures) {
    console.error(`- package: ${failure.packageFile}`);
    console.error(`  expected prepublishOnly: ${failure.expectedCommand}`);
    console.error(`  actual prepublishOnly: ${failure.actualCommand ?? "<missing>"}`);
  }
  process.exit(1);
}

const unpublishedDriftFailures = workspacePackages
  .filter((entry) => entry.private === false)
  .map((entry) => findUnpublishedPackageDrift({
    name: entry.pkg.name,
    version: entry.pkg.version,
    packageDir: entry.packageDir,
    absolutePackageDir: entry.absolutePackageDir
  }))
  .filter(Boolean);

if (unpublishedDriftFailures.length > 0) {
  console.error("Unpublished package drift check failed.");
  console.error(
    "These public workspace packages changed after their published git tag but are not covered by a pending changeset."
  );
  for (const failure of unpublishedDriftFailures) {
    console.error(`- package: ${failure.packageName}@${failure.version}`);
    console.error(`  tag: ${failure.tagName}`);
    console.error("  changed files:");
    for (const changedFile of failure.changedFiles) {
      console.error(`    - ${changedFile}`);
    }
    console.error("  fix: add the package to a pending changeset before releasing dependents.");
  }
  process.exit(1);
}

console.log("Publish guard checks passed.");
