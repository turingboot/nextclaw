export type PlatformSessionTokenState =
  | {
    valid: false;
    reason: "missing" | "malformed" | "expired";
    payload: Record<string, unknown> | null;
  }
  | {
    valid: true;
    reason: "valid";
    payload: Record<string, unknown>;
  };

function decodeBase64UrlSegment(segment: string): string | null {
  try {
    return Buffer.from(segment, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

export function decodePlatformSessionTokenPayload(token: string): Record<string, unknown> | null {
  const segments = token.split(".");
  if (segments.length !== 3 || segments[0] !== "nca" || !segments[1]) {
    return null;
  }
  const raw = decodeBase64UrlSegment(segments[1]);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function readPlatformSessionTokenState(token: string | null | undefined): PlatformSessionTokenState {
  if (typeof token !== "string" || token.trim().length === 0) {
    return {
      valid: false,
      reason: "missing",
      payload: null,
    };
  }
  const trimmed = token.trim();
  const payload = decodePlatformSessionTokenPayload(trimmed);
  if (!payload) {
    return {
      valid: false,
      reason: "malformed",
      payload: null,
    };
  }
  const exp = typeof payload.exp === "number" && Number.isFinite(payload.exp) ? payload.exp : Number.NaN;
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(exp) || exp <= now) {
    return {
      valid: false,
      reason: "expired",
      payload,
    };
  }
  return {
    valid: true,
    reason: "valid",
    payload,
  };
}

export function isValidPlatformSessionToken(token: string | null | undefined): token is string {
  return readPlatformSessionTokenState(token).valid;
}
