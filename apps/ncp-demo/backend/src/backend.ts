import {
  DefaultNcpAgentRuntime,
  DefaultNcpContextBuilder,
  DefaultNcpToolRegistry,
} from "@nextclaw/ncp-agent-runtime";
import {
  DefaultNcpAgentBackend,
  InMemoryRunControllerRegistry,
} from "@nextclaw/ncp-toolkit";
import { resolve } from "node:path";
import { createClockTool } from "./tools/clock-tool.js";
import { createLlmApi, type DemoLlmMode } from "./llm/create-llm-api.js";
import { FileAgentRunStore } from "./stores/file-agent-run-store.js";
import { FileAgentSessionStore } from "./stores/file-agent-session-store.js";

export type { DemoLlmMode } from "./llm/create-llm-api.js";

export function createDemoBackend(): { backend: DefaultNcpAgentBackend; llmMode: DemoLlmMode } {
  const llm = createLlmApi();
  const storeDir = resolveStoreDir(process.env.NCP_DEMO_STORE_DIR);
  return {
    backend: new DefaultNcpAgentBackend({
      endpointId: "ncp-demo-agent",
      sessionStore: new FileAgentSessionStore({ baseDir: storeDir }),
      runStore: new FileAgentRunStore({ baseDir: storeDir }),
      controllerRegistry: new InMemoryRunControllerRegistry(),
      createRuntime: ({ stateManager }) => {
        const toolRegistry = new DefaultNcpToolRegistry([createClockTool()]);
        return new DefaultNcpAgentRuntime({
          contextBuilder: new DefaultNcpContextBuilder(toolRegistry),
          llmApi: llm.api,
          toolRegistry,
          stateManager,
        });
      },
    }),
    llmMode: llm.mode,
  };
}

function resolveStoreDir(value: string | undefined): string {
  const normalized = value?.trim();
  if (normalized) {
    return resolve(normalized);
  }

  return resolve(process.cwd(), ".ncp-demo-store");
}
