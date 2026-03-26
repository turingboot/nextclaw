import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const STEPS = [
  {
    label: "agent-chat-ui build",
    command: ["pnpm", "-C", "packages/nextclaw-agent-chat-ui", "build"]
  },
  {
    label: "agent-chat-ui lint",
    command: ["pnpm", "-C", "packages/nextclaw-agent-chat-ui", "lint"]
  },
  {
    label: "agent-chat-ui tsc",
    command: ["pnpm", "-C", "packages/nextclaw-agent-chat-ui", "tsc"]
  },
  {
    label: "nextclaw-ui build",
    command: ["pnpm", "-C", "packages/nextclaw-ui", "build"]
  },
  {
    label: "nextclaw-ui lint",
    command: ["pnpm", "-C", "packages/nextclaw-ui", "lint"]
  },
  {
    label: "nextclaw-ui tsc",
    command: ["pnpm", "-C", "packages/nextclaw-ui", "tsc"]
  },
  {
    label: "nextclaw build",
    command: ["pnpm", "-C", "packages/nextclaw", "build"]
  },
  {
    label: "nextclaw lint",
    command: ["pnpm", "-C", "packages/nextclaw", "lint"]
  },
  {
    label: "nextclaw tsc",
    command: ["pnpm", "-C", "packages/nextclaw", "tsc"]
  }
];

const formatDuration = (ms) => `${(ms / 1000).toFixed(1)}s`;

for (const step of STEPS) {
  console.log(`[release:check:frontend] start ${step.label}`);
  const startedAt = performance.now();
  const result = spawnSync(step.command[0], step.command.slice(1), {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env
  });
  const duration = performance.now() - startedAt;
  if (result.status !== 0) {
    console.error(
      `[release:check:frontend] failed ${step.label} after ${formatDuration(duration)}`
    );
    process.exit(result.status ?? 1);
  }
  console.log(
    `[release:check:frontend] done ${step.label} in ${formatDuration(duration)}`
  );
}

