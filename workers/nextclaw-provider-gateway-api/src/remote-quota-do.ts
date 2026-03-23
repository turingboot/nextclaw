import {
  acquireRemoteBrowserConnection,
  consumeRemoteRequestQuota,
  createEmptyRemoteQuotaState,
  DEFAULT_REMOTE_QUOTA_INSTANCE_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_SESSION_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_SESSION_REQUESTS_PER_MINUTE,
  DEFAULT_REMOTE_QUOTA_USER_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_USER_REQUESTS_PER_MINUTE,
  releaseRemoteBrowserConnection,
  type RemoteQuotaConfig,
  type RemoteQuotaDecision,
  type RemoteQuotaState,
} from "./remote-quota-policy";
import type { Env } from "./types/platform";
import { isRecord, jsonErrorResponse, parseBoundedInt } from "./utils/platform-utils";

const REMOTE_QUOTA_STATE_STORAGE_KEY = "remote-quota-state";

export class NextclawRemoteQuotaDurableObject {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST") {
      return new Response("method_not_allowed", { status: 405 });
    }

    if (url.pathname === "/browser-connection/acquire") {
      return await this.handleBrowserConnectionAcquire(request);
    }
    if (url.pathname === "/browser-connection/release") {
      return await this.handleBrowserConnectionRelease(request);
    }
    if (url.pathname === "/request/consume") {
      return await this.handleRequestConsume(request);
    }
    return new Response("not_found", { status: 404 });
  }

  private async handleBrowserConnectionAcquire(request: Request): Promise<Response> {
    const payload = await readQuotaPayload(request);
    const ticket = readRequiredString(payload, "ticket");
    const clientId = readRequiredString(payload, "clientId");
    const sessionId = readRequiredString(payload, "sessionId");
    const instanceId = readRequiredString(payload, "instanceId");
    if (!ticket || !clientId || !sessionId || !instanceId) {
      return jsonErrorResponse(400, "REMOTE_QUOTA_INVALID_REQUEST", "ticket, clientId, sessionId, and instanceId are required.");
    }

    return await this.runMutation((storedState, config, nowMs) => {
      return acquireRemoteBrowserConnection(storedState, config, {
        nowMs,
        ticket,
        clientId,
        sessionId,
        instanceId
      });
    });
  }

  private async handleBrowserConnectionRelease(request: Request): Promise<Response> {
    const payload = await readQuotaPayload(request);
    const ticket = readRequiredString(payload, "ticket");
    if (!ticket) {
      return jsonErrorResponse(400, "REMOTE_QUOTA_INVALID_REQUEST", "ticket is required.");
    }

    return await this.runMutation((storedState, _config, nowMs) => {
      return releaseRemoteBrowserConnection(storedState, nowMs, ticket);
    });
  }

  private async handleRequestConsume(request: Request): Promise<Response> {
    const payload = await readQuotaPayload(request);
    const sessionId = readRequiredString(payload, "sessionId");
    if (!sessionId) {
      return jsonErrorResponse(400, "REMOTE_QUOTA_INVALID_REQUEST", "sessionId is required.");
    }

    return await this.runMutation((storedState, config, nowMs) => {
      return consumeRemoteRequestQuota(storedState, config, {
        nowMs,
        sessionId
      });
    });
  }

  private async runMutation<T>(
    mutate: (
      storedState: RemoteQuotaState,
      config: RemoteQuotaConfig,
      nowMs: number
    ) => RemoteQuotaDecision<T>
  ): Promise<Response> {
    const nowMs = Date.now();
    const storedState = (await this.state.storage.get<RemoteQuotaState>(REMOTE_QUOTA_STATE_STORAGE_KEY))
      ?? createEmptyRemoteQuotaState(nowMs);
    const decision = mutate(storedState, readRemoteQuotaConfig(this.env), nowMs);
    await this.state.storage.put(REMOTE_QUOTA_STATE_STORAGE_KEY, decision.state);
    return buildQuotaDecisionResponse(decision);
  }
}

export { NextclawRemoteQuotaDurableObject as NextclawQuotaDurableObject };

function readRemoteQuotaConfig(env: Env): RemoteQuotaConfig {
  return {
    userRequestsPerMinute: parseBoundedInt(
      env.REMOTE_QUOTA_USER_REQUESTS_PER_MINUTE,
      DEFAULT_REMOTE_QUOTA_USER_REQUESTS_PER_MINUTE,
      10,
      10_000
    ),
    sessionRequestsPerMinute: parseBoundedInt(
      env.REMOTE_QUOTA_SESSION_REQUESTS_PER_MINUTE,
      DEFAULT_REMOTE_QUOTA_SESSION_REQUESTS_PER_MINUTE,
      5,
      10_000
    ),
    userConnections: parseBoundedInt(
      env.REMOTE_QUOTA_USER_CONNECTIONS,
      DEFAULT_REMOTE_QUOTA_USER_CONNECTIONS,
      1,
      100
    ),
    sessionConnections: parseBoundedInt(
      env.REMOTE_QUOTA_SESSION_CONNECTIONS,
      DEFAULT_REMOTE_QUOTA_SESSION_CONNECTIONS,
      1,
      20
    ),
    instanceConnections: parseBoundedInt(
      env.REMOTE_QUOTA_INSTANCE_CONNECTIONS,
      DEFAULT_REMOTE_QUOTA_INSTANCE_CONNECTIONS,
      1,
      50
    )
  };
}

function buildQuotaDecisionResponse<T>(decision: RemoteQuotaDecision<T>): Response {
  if (decision.ok) {
    return new Response(
      JSON.stringify({
        ok: true,
        data: decision.data
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      }
    );
  }
  return new Response(
    JSON.stringify({
      ok: false,
      degraded: true,
      error: {
        ...decision.error
      }
    }),
    {
      status: 429,
      headers: buildQuotaHeaders(decision.error.retryAfterSeconds)
    }
  );
}

async function readQuotaPayload(request: Request): Promise<Record<string, unknown>> {
  try {
    const payload = await request.json<unknown>();
    return isRecord(payload) ? payload : {};
  } catch {
    return {};
  }
}

function readRequiredString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function buildQuotaHeaders(retryAfterSeconds: number): HeadersInit {
  return {
    "content-type": "application/json",
    "retry-after": String(retryAfterSeconds),
    "x-nextclaw-degraded": "quota_guard"
  };
}
