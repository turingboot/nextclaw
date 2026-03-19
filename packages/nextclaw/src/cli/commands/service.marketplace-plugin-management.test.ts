import { afterEach, describe, expect, it, vi } from "vitest";
import * as pluginMutations from "./plugin-mutation-actions.js";
import { ServiceCommands } from "./service.js";

describe("ServiceCommands marketplace plugin management", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("installs marketplace plugins in-process instead of spawning a CLI subcommand", async () => {
    const service = new ServiceCommands({
      requestRestart: vi.fn().mockResolvedValue(undefined),
    });
    const serviceAny = service as any;
    const installSpy = vi.spyOn(pluginMutations, "installPluginMutation").mockResolvedValue({
      message: "Installed plugin: codex",
    });
    const runCliSpy = vi.spyOn(serviceAny, "runCliSubcommand");

    await expect(serviceAny.installMarketplacePlugin("@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk")).resolves.toEqual({
      message: "Installed plugin: codex",
    });
    expect(installSpy).toHaveBeenCalledWith("@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk");
    expect(runCliSpy).not.toHaveBeenCalled();
  });

  it("manages marketplace plugins in-process instead of spawning a CLI subcommand", async () => {
    const service = new ServiceCommands({
      requestRestart: vi.fn().mockResolvedValue(undefined),
    });
    const serviceAny = service as any;
    serviceAny.applyLiveConfigReload = vi.fn().mockResolvedValue(undefined);
    const enableSpy = vi.spyOn(pluginMutations, "enablePluginMutation").mockResolvedValue({
      message: 'Enabled plugin "codex".',
    });
    const disableSpy = vi.spyOn(pluginMutations, "disablePluginMutation").mockResolvedValue({
      message: 'Disabled plugin "codex".',
    });
    const uninstallSpy = vi.spyOn(pluginMutations, "uninstallPluginMutation").mockResolvedValue({
      message: 'Uninstalled plugin "codex". Removed: config entry.',
      warnings: [],
    });
    const runCliSpy = vi.spyOn(serviceAny, "runCliSubcommand");

    await expect(serviceAny.enableMarketplacePlugin("codex")).resolves.toEqual({
      message: 'Enabled plugin "codex".',
    });
    await expect(serviceAny.disableMarketplacePlugin("codex")).resolves.toEqual({
      message: 'Disabled plugin "codex".',
    });
    await expect(serviceAny.uninstallMarketplacePlugin("codex")).resolves.toEqual({
      message: 'Uninstalled plugin "codex". Removed: config entry.',
    });

    expect(enableSpy).toHaveBeenCalledWith("codex");
    expect(disableSpy).toHaveBeenCalledTimes(2);
    expect(disableSpy).toHaveBeenNthCalledWith(1, "codex");
    expect(disableSpy).toHaveBeenNthCalledWith(2, "codex");
    expect(uninstallSpy).toHaveBeenCalledWith("codex", { force: true });
    expect(runCliSpy).not.toHaveBeenCalled();
    expect(serviceAny.applyLiveConfigReload).toHaveBeenCalledTimes(4);
  });
});
