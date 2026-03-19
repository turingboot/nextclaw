import type { NcpSessionPatch } from "@nextclaw/ncp";
import type { AgentSessionRecord, LiveSessionState } from "./agent-backend-types.js";
import { readMessages } from "./agent-backend-session-utils.js";

export function buildUpdatedSessionRecord(params: {
  sessionId: string;
  patch: NcpSessionPatch;
  liveSession: LiveSessionState | null;
  storedSession: AgentSessionRecord | null;
  updatedAt: string;
}): AgentSessionRecord {
  const nextMetadata =
    params.patch.metadata === null
      ? {}
      : params.patch.metadata
        ? structuredClone(params.patch.metadata)
        : structuredClone(params.liveSession?.metadata ?? params.storedSession?.metadata ?? {});

  if (params.liveSession) {
    params.liveSession.metadata = structuredClone(nextMetadata);
  }

  return {
    sessionId: params.sessionId,
    messages: params.liveSession
      ? readMessages(params.liveSession.stateManager.getSnapshot())
      : params.storedSession?.messages.map((message) => structuredClone(message)) ?? [],
    updatedAt: params.updatedAt,
    metadata: nextMetadata,
  };
}

export function buildPersistedLiveSessionRecord(params: {
  sessionId: string;
  session: LiveSessionState;
  updatedAt: string;
}): AgentSessionRecord {
  return {
    sessionId: params.sessionId,
    messages: readMessages(params.session.stateManager.getSnapshot()),
    updatedAt: params.updatedAt,
    metadata: {
      ...(params.session.metadata ? structuredClone(params.session.metadata) : {}),
      ...(params.session.activeExecution?.requestEnvelope.metadata
        ? structuredClone(params.session.activeExecution.requestEnvelope.metadata)
        : {}),
    },
  };
}
