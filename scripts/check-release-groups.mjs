import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT_DIR = process.cwd();
const WORKSPACE_ROOTS = ["packages", "apps", "workers"];

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

const publishGuardFailures = WORKSPACE_ROOTS.flatMap((workspaceRoot) => {
  const absoluteWorkspaceRoot = join(ROOT_DIR, workspaceRoot);
  return collectPackageJsonFiles(absoluteWorkspaceRoot)
    .map((packageFile) => {
      const pkg = JSON.parse(readFileSync(packageFile, "utf8"));
      if (pkg.private !== false) {
        return null;
      }
      const expectedCommand = `node ${relative(
        packageFile.replace(/package\.json$/, ""),
        join(ROOT_DIR, "scripts", "ensure-pnpm-publish.mjs")
      ).replaceAll("\\", "/")}`;
      const actualCommand = pkg.scripts?.prepublishOnly;
      if (actualCommand === expectedCommand) {
        return null;
      }
      return {
        packageFile: relative(ROOT_DIR, packageFile).replaceAll("\\", "/"),
        expectedCommand,
        actualCommand: typeof actualCommand === "string" ? actualCommand : null
      };
    })
    .filter(Boolean);
});

if (publishGuardFailures.length > 0) {
  console.error("Publish guard check failed.");
  for (const failure of publishGuardFailures) {
    console.error(`- package: ${failure.packageFile}`);
    console.error(`  expected prepublishOnly: ${failure.expectedCommand}`);
    console.error(`  actual prepublishOnly: ${failure.actualCommand ?? "<missing>"}`);
  }
  process.exit(1);
}

console.log("Publish guard checks passed.");
