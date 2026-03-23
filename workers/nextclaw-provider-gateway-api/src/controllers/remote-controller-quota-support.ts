import type { RemoteAccessSessionRow } from "../types/platform";
import type { Env } from "../types/platform";
import {
  acquireRemoteQuotaBrowserConnection,
  buildRemoteQuotaHttpRejection,
  consumeRemoteQuotaRequest,
  releaseRemoteQuotaBrowserConnection,
} from "../services/remote-quota-guard.service";

export async function enforceRemoteSessionQuota(
  env: Env,
  session: RemoteAccessSessionRow,
  operationKind: "runtime_http" | "proxy_http"
): Promise<Response | null> {
  const quota = await consumeRemoteQuotaRequest(env, {
    userId: session.user_id,
    sessionId: session.id,
    operationKind
  });
  return quota.ok ? null : buildRemoteQuotaHttpRejection(quota.error);
}

export async function openRemoteBrowserRelaySocket(params: {
  env: Env;
  rawRequest: Request;
  session: RemoteAccessSessionRow;
  instanceId: string;
}): Promise<Response> {
  const clientId = crypto.randomUUID();
  const quotaTicket = crypto.randomUUID();
  const quota = await acquireRemoteQuotaBrowserConnection(params.env, {
    userId: params.session.user_id,
    sessionId: params.session.id,
    instanceId: params.instanceId,
    clientId,
    ticket: quotaTicket
  });
  if (!quota.ok) {
    return buildRemoteQuotaHttpRejection(quota.error);
  }

  const stub = params.env.NEXTCLAW_REMOTE_RELAY.get(params.env.NEXTCLAW_REMOTE_RELAY.idFromName(params.instanceId));
  const headers = new Headers(params.rawRequest.headers);
  headers.set("x-nextclaw-remote-role", "browser");
  headers.set("x-nextclaw-remote-device-id", params.instanceId);
  headers.set("x-nextclaw-remote-client-id", clientId);
  headers.set("x-nextclaw-remote-user-id", params.session.user_id);
  headers.set("x-nextclaw-remote-session-id", params.session.id);
  headers.set("x-nextclaw-remote-quota-ticket", quota.data.ticket);

  try {
    const response = await stub.fetch(new Request(params.rawRequest, { headers }));
    if (response.status === 101) {
      return response;
    }
    await releaseRemoteQuotaBrowserConnection(params.env, {
      userId: params.session.user_id,
      ticket: quota.data.ticket
    });
    return response;
  } catch (error) {
    await releaseRemoteQuotaBrowserConnection(params.env, {
      userId: params.session.user_id,
      ticket: quota.data.ticket
    });
    throw error;
  }
}
