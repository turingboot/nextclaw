import { describe, expect, it } from "vitest";
import { buildReloadPlan } from "./reload.js";

describe("buildReloadPlan", () => {
  it("does not force channel restart for non-channel plugin changes", () => {
    const plan = buildReloadPlan(["plugins.entries.nextclaw-ncp-runtime-plugin-codex-sdk.enabled"]);
    expect(plan.reloadPlugins).toBe(true);
    expect(plan.restartChannels).toBe(false);
  });
});
