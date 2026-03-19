import fs from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { getWorkspacePathFromConfig, type Config } from "@nextclaw/core";
import { resolvePluginInstallDir } from "./install.js";
import { loadPluginManifest } from "./manifest.js";

export type UninstallActions = {
  entry: boolean;
  install: boolean;
  allowlist: boolean;
  loadPath: boolean;
  directory: boolean;
};

type PluginInstallRecord = NonNullable<Config["plugins"]["installs"]>[string];

function isLinkedPathInstall(record: PluginInstallRecord | undefined): boolean {
  if (!record || record.source !== "path") {
    return false;
  }
  if (!record.sourcePath || !record.installPath) {
    return true;
  }
  return path.resolve(record.sourcePath) === path.resolve(record.installPath);
}

export type UninstallPluginResult =
  | {
      ok: true;
      config: Config;
      pluginId: string;
      actions: UninstallActions;
      warnings: string[];
    }
  | { ok: false; error: string };

function pushUniquePath(targets: string[], candidate: string | null | undefined): void {
  if (!candidate) {
    return;
  }
  const resolved = path.resolve(candidate);
  if (!targets.includes(resolved)) {
    targets.push(resolved);
  }
}

export function resolveUninstallDirectoryTarget(params: {
  pluginId: string;
  hasInstall: boolean;
  installRecord?: PluginInstallRecord;
  extensionsDir?: string;
}): string | null {
  if (!params.hasInstall) {
    return null;
  }

  if (isLinkedPathInstall(params.installRecord)) {
    return null;
  }

  let defaultPath: string;
  try {
    defaultPath = resolvePluginInstallDir(params.pluginId, params.extensionsDir);
  } catch {
    return null;
  }

  const configuredPath = params.installRecord?.installPath;
  if (!configuredPath) {
    return defaultPath;
  }

  if (path.resolve(configuredPath) === path.resolve(defaultPath)) {
    return configuredPath;
  }

  return defaultPath;
}

export function resolveUninstallDirectoryTargets(params: {
  config: Config;
  pluginId: string;
  hasInstall: boolean;
  installRecord?: PluginInstallRecord;
  extensionsDir?: string;
}): string[] {
  if (!params.hasInstall || isLinkedPathInstall(params.installRecord)) {
    return [];
  }

  const targets: string[] = [];
  pushUniquePath(
    targets,
    resolveUninstallDirectoryTarget({
      pluginId: params.pluginId,
      hasInstall: params.hasInstall,
      installRecord: params.installRecord,
      extensionsDir: params.extensionsDir
    })
  );

  pushUniquePath(targets, params.installRecord?.installPath);

  const workspaceDir = getWorkspacePathFromConfig(params.config);
  pushUniquePath(targets, path.join(workspaceDir, ".nextclaw", "extensions", params.pluginId));

  return targets;
}

export function removePluginFromConfig(
  config: Config,
  pluginId: string
): { config: Config; actions: Omit<UninstallActions, "directory"> } {
  const actions: Omit<UninstallActions, "directory"> = {
    entry: false,
    install: false,
    allowlist: false,
    loadPath: false
  };

  const pluginsConfig = config.plugins ?? {};

  let entries = pluginsConfig.entries;
  if (entries && pluginId in entries) {
    const rest = { ...entries };
    delete rest[pluginId];
    entries = Object.keys(rest).length > 0 ? rest : undefined;
    actions.entry = true;
  }

  let installs = pluginsConfig.installs;
  const installRecord = installs?.[pluginId];
  if (installs && pluginId in installs) {
    const rest = { ...installs };
    delete rest[pluginId];
    installs = Object.keys(rest).length > 0 ? rest : undefined;
    actions.install = true;
  }

  let allow = pluginsConfig.allow;
  if (Array.isArray(allow) && allow.includes(pluginId)) {
    allow = allow.filter((id) => id !== pluginId);
    if (allow.length === 0) {
      allow = undefined;
    }
    actions.allowlist = true;
  }

  let load = pluginsConfig.load;
  const configuredLoadPaths = Array.isArray(load?.paths) ? load.paths : [];
  const nextLoadPaths = configuredLoadPaths.filter((entry) => !matchesPluginLoadPath(entry, pluginId));
  if (nextLoadPaths.length !== configuredLoadPaths.length) {
    load = nextLoadPaths.length > 0 ? { ...load, paths: nextLoadPaths } : undefined;
    actions.loadPath = true;
  } else if (installRecord?.source === "path" && installRecord.sourcePath && configuredLoadPaths.includes(installRecord.sourcePath)) {
    const filteredLoadPaths = configuredLoadPaths.filter((entry) => entry !== installRecord.sourcePath);
    load = filteredLoadPaths.length > 0 ? { ...load, paths: filteredLoadPaths } : undefined;
    actions.loadPath = true;
  }

  const nextPlugins: Config["plugins"] = {
    ...pluginsConfig
  };

  if (entries === undefined) {
    delete (nextPlugins as Record<string, unknown>).entries;
  } else {
    nextPlugins.entries = entries;
  }

  if (installs === undefined) {
    delete (nextPlugins as Record<string, unknown>).installs;
  } else {
    nextPlugins.installs = installs;
  }

  if (allow === undefined) {
    delete (nextPlugins as Record<string, unknown>).allow;
  } else {
    nextPlugins.allow = allow;
  }

  if (load === undefined) {
    delete (nextPlugins as Record<string, unknown>).load;
  } else {
    nextPlugins.load = load;
  }

  return {
    config: {
      ...config,
      plugins: nextPlugins
    },
    actions
  };
}

function matchesPluginLoadPath(rawPath: string, pluginId: string): boolean {
  const normalizedPath = rawPath.trim();
  if (!normalizedPath) {
    return false;
  }

  const resolvedPath = path.resolve(normalizedPath);
  if (!existsSync(resolvedPath)) {
    return false;
  }

  const candidateRoot = (() => {
    try {
      return statSync(resolvedPath).isDirectory() ? resolvedPath : path.dirname(resolvedPath);
    } catch {
      return null;
    }
  })();
  if (!candidateRoot) {
    return false;
  }

  const manifest = loadPluginManifest(candidateRoot);
  return manifest.ok && manifest.manifest.id === pluginId;
}

export async function uninstallPlugin(params: {
  config: Config;
  pluginId: string;
  deleteFiles?: boolean;
  extensionsDir?: string;
}): Promise<UninstallPluginResult> {
  const { config, pluginId, deleteFiles = true, extensionsDir } = params;

  const hasEntry = pluginId in (config.plugins.entries ?? {});
  const hasInstall = pluginId in (config.plugins.installs ?? {});

  if (!hasEntry && !hasInstall) {
    return { ok: false, error: `Plugin not found: ${pluginId}` };
  }

  const installRecord = config.plugins.installs?.[pluginId];
  const isLinked = isLinkedPathInstall(installRecord);

  const { config: nextConfig, actions: configActions } = removePluginFromConfig(config, pluginId);

  const actions: UninstallActions = {
    ...configActions,
    directory: false
  };
  const warnings: string[] = [];

  const deleteTargets =
    deleteFiles && !isLinked
      ? resolveUninstallDirectoryTargets({
          config,
          pluginId,
          hasInstall,
          installRecord,
          extensionsDir
        })
      : [];

  for (const deleteTarget of deleteTargets) {
    const existed = await fs
      .access(deleteTarget)
      .then(() => true)
      .catch(() => false);

    try {
      await fs.rm(deleteTarget, { recursive: true, force: true });
      actions.directory = actions.directory || existed;
    } catch (error) {
      warnings.push(
        `Failed to remove plugin directory ${deleteTarget}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    ok: true,
    config: nextConfig,
    pluginId,
    actions,
    warnings
  };
}
