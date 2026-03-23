import {
  buildRemoteQuotaRequestErrorFrame,
  buildRemoteQuotaStreamErrorFrame,
  consumeRemoteQuotaRequest,
  releaseRemoteQuotaBrowserConnection,
} from "./services/remote-quota-guard.service";
import type { BrowserCommandFrame, ClientAttachment } from "./remote-relay.types";
import type { Env } from "./types/platform";

export function readRemoteBrowserAttachment(request: Request): ClientAttachment | null {
  const userId = request.headers.get("x-nextclaw-remote-user-id")?.trim();
  const sessionId = request.headers.get("x-nextclaw-remote-session-id")?.trim();
  const quotaTicket = request.headers.get("x-nextclaw-remote-quota-ticket")?.trim();
  const instanceId = request.headers.get("x-nextclaw-remote-device-id")?.trim();
  if (!userId || !sessionId || !quotaTicket || !instanceId) {
    return null;
  }
  return {
    type: "client",
    clientId: request.headers.get("x-nextclaw-remote-client-id")?.trim() || crypto.randomUUID(),
    userId,
    sessionId,
    instanceId,
    quotaTicket,
    connectedAt: new Date().toISOString()
  };
}

export async function consumeRemoteBrowserFrameQuota(
  env: Env,
  attachment: ClientAttachment,
  frame: BrowserCommandFrame
): Promise<Record<string, unknown> | null> {
  if (frame.type === "stream.cancel") {
    return null;
  }
  const quota = await consumeRemoteQuotaRequest(env, {
    userId: attachment.userId,
    sessionId: attachment.sessionId
  });
  if (quota.ok) {
    return null;
  }
  return frame.type === "request"
    ? buildRemoteQuotaRequestErrorFrame(frame.id, quota.error)
    : buildRemoteQuotaStreamErrorFrame(frame.streamId, quota.error);
}

export async function releaseRemoteClientQuota(env: Env, attachment: ClientAttachment): Promise<void> {
  await releaseRemoteQuotaBrowserConnection(env, {
    userId: attachment.userId,
    ticket: attachment.quotaTicket
  });
}
