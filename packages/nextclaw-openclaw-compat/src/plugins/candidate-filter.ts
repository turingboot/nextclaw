import path from "node:path";
import type { PluginCandidate } from "./discovery.js";

function isPathInsideRoot(candidatePath: string, rootPath: string): boolean {
  const normalizedCandidate = path.resolve(candidatePath);
  const normalizedRoot = path.resolve(rootPath);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}${path.sep}`);
}

export function filterPluginCandidatesByExcludedRoots(
  candidates: readonly PluginCandidate[],
  excludedRoots: readonly string[],
): PluginCandidate[] {
  const normalizedRoots = excludedRoots.map((entry) => path.resolve(entry));
  if (normalizedRoots.length === 0) {
    return [...candidates];
  }

  return candidates.filter((candidate) => {
    const candidatePaths = [candidate.source, candidate.rootDir, candidate.packageDir].filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
    );
    return !normalizedRoots.some((rootPath) =>
      candidatePaths.some((candidatePath) => isPathInsideRoot(candidatePath, rootPath)),
    );
  });
}
