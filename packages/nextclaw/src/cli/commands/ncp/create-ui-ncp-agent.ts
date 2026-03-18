import type {
  Config,
  CronService,
  ExtensionRegistry,
  GatewayController,
  MessageBus,
  ProviderManager,
  SessionManager,
} from "@nextclaw/core";
import { DefaultNcpAgentRuntime } from "@nextclaw/ncp-agent-runtime";
import { createAgentClientFromServer, DefaultNcpAgentBackend } from "@nextclaw/ncp-toolkit";
import type { UiNcpAgent } from "@nextclaw/server";
import { NextclawNcpContextBuilder } from "./nextclaw-ncp-context-builder.js";
import { NextclawAgentSessionStore } from "./nextclaw-agent-session-store.js";
import { NextclawNcpToolRegistry } from "./nextclaw-ncp-tool-registry.js";
import { ProviderManagerNcpLLMApi } from "./provider-manager-ncp-llm-api.js";

type MessageToolHintsResolver = (params: {
  sessionKey: string;
  channel: string;
  chatId: string;
  accountId?: string | null;
}) => string[];

export async function createUiNcpAgent(params: {
  bus: MessageBus;
  providerManager: ProviderManager;
  sessionManager: SessionManager;
  cronService?: CronService | null;
  gatewayController?: GatewayController;
  getConfig: () => Config;
  getExtensionRegistry?: () => ExtensionRegistry | undefined;
  resolveMessageToolHints?: MessageToolHintsResolver;
}): Promise<UiNcpAgent> {
  const sessionStore = new NextclawAgentSessionStore(params.sessionManager);
  const backend = new DefaultNcpAgentBackend({
    endpointId: "nextclaw-ui-agent",
    sessionStore,
    createRuntime: ({ sessionId: _sessionId, stateManager }) => {
      const toolRegistry = new NextclawNcpToolRegistry({
        bus: params.bus,
        providerManager: params.providerManager,
        sessionManager: params.sessionManager,
        cronService: params.cronService,
        gatewayController: params.gatewayController,
        getConfig: params.getConfig,
        getExtensionRegistry: params.getExtensionRegistry,
      });
      return new DefaultNcpAgentRuntime({
        contextBuilder: new NextclawNcpContextBuilder({
          sessionManager: params.sessionManager,
          toolRegistry,
          getConfig: params.getConfig,
          resolveMessageToolHints: params.resolveMessageToolHints,
        }),
        llmApi: new ProviderManagerNcpLLMApi(params.providerManager),
        toolRegistry,
        stateManager,
      });
    },
  });

  await backend.start();

  return {
    basePath: "/api/ncp/agent",
    agentClientEndpoint: createAgentClientFromServer(backend),
    streamProvider: backend,
    sessionApi: backend
  };
}
