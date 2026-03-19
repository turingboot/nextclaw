import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CHANGESET_DIR = join(process.cwd(), ".changeset");
const RELEASE_GROUPS = [
  ["@nextclaw/mcp", "@nextclaw/server", "nextclaw"]
];

const readPendingPackages = () => {
  const files = readdirSync(CHANGESET_DIR).filter(
    (entry) => entry.endsWith(".md") && entry !== "README.md"
  );
  const packages = new Set();
  for (const file of files) {
    const content = readFileSync(join(CHANGESET_DIR, file), "utf8");
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      continue;
    }
    for (const line of match[1].split("\n")) {
      const packageMatch = line.match(/^[\"']([^\"']+)[\"']\s*:/);
      if (packageMatch) {
        packages.add(packageMatch[1]);
      }
    }
  }
  return packages;
};

const pendingPackages = readPendingPackages();
const failures = RELEASE_GROUPS.map((group) => {
  const selected = group.filter((name) => pendingPackages.has(name));
  if (selected.length === 0 || selected.length === group.length) {
    return null;
  }
  return {
    group,
    selected,
    missing: group.filter((name) => !pendingPackages.has(name))
  };
}).filter(Boolean);

if (failures.length > 0) {
  console.error("Release group check failed.");
  for (const failure of failures) {
    console.error(`- group: ${failure.group.join(", ")}`);
    console.error(`  selected: ${failure.selected.join(", ")}`);
    console.error(`  missing: ${failure.missing.join(", ")}`);
  }
  process.exit(1);
}

console.log("Release group check passed.");
