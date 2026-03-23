export const REMOTE_QUOTA_WINDOW_MS = 60_000;
export const REMOTE_QUOTA_CONNECTION_RETRY_AFTER_SECONDS = 5;
export const DEFAULT_REMOTE_QUOTA_USER_REQUESTS_PER_MINUTE = 300;
export const DEFAULT_REMOTE_QUOTA_SESSION_REQUESTS_PER_MINUTE = 180;
export const DEFAULT_REMOTE_QUOTA_USER_CONNECTIONS = 6;
export const DEFAULT_REMOTE_QUOTA_SESSION_CONNECTIONS = 2;
export const DEFAULT_REMOTE_QUOTA_INSTANCE_CONNECTIONS = 4;

export type RemoteQuotaConfig = {
  userRequestsPerMinute: number;
  sessionRequestsPerMinute: number;
  userConnections: number;
  sessionConnections: number;
  instanceConnections: number;
};

export type RemoteQuotaTicket = {
  ticket: string;
  clientId: string;
  sessionId: string;
  instanceId: string;
  connectedAtMs: number;
};

type RemoteQuotaWindow = {
  windowStartedAtMs: number;
  count: number;
};

export type RemoteQuotaState = {
  browserConnections: Record<string, RemoteQuotaTicket>;
  userRequestWindow: RemoteQuotaWindow;
  sessionRequestWindows: Record<string, RemoteQuotaWindow>;
};

export type RemoteQuotaError = {
  code:
    | "REMOTE_USER_RATE_LIMITED"
    | "REMOTE_SESSION_RATE_LIMITED"
    | "REMOTE_USER_CONNECTION_LIMIT"
    | "REMOTE_SESSION_CONNECTION_LIMIT"
    | "REMOTE_INSTANCE_CONNECTION_LIMIT"
    | "REMOTE_QUOTA_GUARD_UNAVAILABLE";
  message: string;
  retryAfterSeconds: number;
};

export type RemoteQuotaSuccess<T> = {
  ok: true;
  data: T;
  state: RemoteQuotaState;
};

export type RemoteQuotaFailure = {
  ok: false;
  error: RemoteQuotaError;
  state: RemoteQuotaState;
};

export type RemoteQuotaDecision<T> = RemoteQuotaSuccess<T> | RemoteQuotaFailure;

type ConnectionUsage = {
  userCount: number;
  sessionCount: number;
  instanceCount: number;
};

type RequestWindowUsage = {
  userWindow: RemoteQuotaWindow;
  sessionWindow: RemoteQuotaWindow;
};

export function createEmptyRemoteQuotaState(nowMs: number): RemoteQuotaState {
  return {
    browserConnections: {},
    userRequestWindow: createWindow(nowMs),
    sessionRequestWindows: {}
  };
}

export function acquireRemoteBrowserConnection(
  state: RemoteQuotaState | null | undefined,
  config: RemoteQuotaConfig,
  input: {
    nowMs: number;
    ticket: string;
    clientId: string;
    sessionId: string;
    instanceId: string;
  }
): RemoteQuotaDecision<{ ticket: string }> {
  const normalizedState = normalizeRemoteQuotaState(state, input.nowMs);
  const usage = collectConnectionUsage(normalizedState, input.sessionId, input.instanceId);

  if (usage.userCount >= config.userConnections) {
    return reject(normalizedState, {
      code: "REMOTE_USER_CONNECTION_LIMIT",
      message: "Remote access is temporarily degraded because this user has too many active browser connections.",
      retryAfterSeconds: REMOTE_QUOTA_CONNECTION_RETRY_AFTER_SECONDS
    });
  }

  if (usage.sessionCount >= config.sessionConnections) {
    return reject(normalizedState, {
      code: "REMOTE_SESSION_CONNECTION_LIMIT",
      message: "Remote access is temporarily degraded because this session has too many active browser connections.",
      retryAfterSeconds: REMOTE_QUOTA_CONNECTION_RETRY_AFTER_SECONDS
    });
  }

  if (usage.instanceCount >= config.instanceConnections) {
    return reject(normalizedState, {
      code: "REMOTE_INSTANCE_CONNECTION_LIMIT",
      message: "Remote access is temporarily degraded because this instance has too many active browser connections.",
      retryAfterSeconds: REMOTE_QUOTA_CONNECTION_RETRY_AFTER_SECONDS
    });
  }

  const nextState: RemoteQuotaState = {
    ...normalizedState,
    browserConnections: {
      ...normalizedState.browserConnections,
      [input.ticket]: {
        ticket: input.ticket,
        clientId: input.clientId,
        sessionId: input.sessionId,
        instanceId: input.instanceId,
        connectedAtMs: input.nowMs
      }
    }
  };
  return {
    ok: true,
    data: { ticket: input.ticket },
    state: nextState
  };
}

export function releaseRemoteBrowserConnection(
  state: RemoteQuotaState | null | undefined,
  nowMs: number,
  ticket: string
): RemoteQuotaSuccess<{ released: boolean }> {
  const normalizedState = normalizeRemoteQuotaState(state, nowMs);
  if (!normalizedState.browserConnections[ticket]) {
    return {
      ok: true,
      data: { released: false },
      state: normalizedState
    };
  }
  const nextConnections = { ...normalizedState.browserConnections };
  delete nextConnections[ticket];
  return {
    ok: true,
    data: { released: true },
    state: {
      ...normalizedState,
      browserConnections: nextConnections
    }
  };
}

export function consumeRemoteRequestQuota(
  state: RemoteQuotaState | null | undefined,
  config: RemoteQuotaConfig,
  input: {
    nowMs: number;
    sessionId: string;
  }
): RemoteQuotaDecision<{ remainingUserRequests: number; remainingSessionRequests: number }> {
  const normalizedState = normalizeRemoteQuotaState(state, input.nowMs);
  const usage = readRequestWindowUsage(normalizedState, input.sessionId, input.nowMs);

  if (usage.sessionWindow.count >= config.sessionRequestsPerMinute) {
    return reject(normalizedState, {
      code: "REMOTE_SESSION_RATE_LIMITED",
      message: "Remote access is temporarily degraded because this session is sending requests too quickly.",
      retryAfterSeconds: secondsUntilWindowReset(input.nowMs)
    });
  }

  if (usage.userWindow.count >= config.userRequestsPerMinute) {
    return reject(normalizedState, {
      code: "REMOTE_USER_RATE_LIMITED",
      message: "Remote access is temporarily degraded because this user is sending requests too quickly.",
      retryAfterSeconds: secondsUntilWindowReset(input.nowMs)
    });
  }

  const nextUserWindow = incrementWindow(usage.userWindow);
  const nextSessionWindow = incrementWindow(usage.sessionWindow);
  return {
    ok: true,
    data: {
      remainingUserRequests: Math.max(0, config.userRequestsPerMinute - nextUserWindow.count),
      remainingSessionRequests: Math.max(0, config.sessionRequestsPerMinute - nextSessionWindow.count)
    },
    state: {
      ...normalizedState,
      userRequestWindow: nextUserWindow,
      sessionRequestWindows: {
        ...normalizedState.sessionRequestWindows,
        [input.sessionId]: nextSessionWindow
      }
    }
  };
}

function normalizeRemoteQuotaState(state: RemoteQuotaState | null | undefined, nowMs: number): RemoteQuotaState {
  const nextState = state ?? createEmptyRemoteQuotaState(nowMs);
  const normalizedUserWindow = normalizeWindow(nextState.userRequestWindow, nowMs);
  const normalizedSessionWindows = normalizeSessionWindows(nextState.sessionRequestWindows, nowMs);
  return {
    browserConnections: { ...nextState.browserConnections },
    userRequestWindow: normalizedUserWindow,
    sessionRequestWindows: normalizedSessionWindows
  };
}

function collectConnectionUsage(state: RemoteQuotaState, sessionId: string, instanceId: string): ConnectionUsage {
  let sessionCount = 0;
  let instanceCount = 0;
  const allConnections = Object.values(state.browserConnections);
  for (const connection of allConnections) {
    if (connection.sessionId === sessionId) {
      sessionCount += 1;
    }
    if (connection.instanceId === instanceId) {
      instanceCount += 1;
    }
  }
  return {
    userCount: allConnections.length,
    sessionCount,
    instanceCount
  };
}

function readRequestWindowUsage(state: RemoteQuotaState, sessionId: string, nowMs: number): RequestWindowUsage {
  const userWindow = normalizeWindow(state.userRequestWindow, nowMs);
  const sessionWindow = normalizeWindow(state.sessionRequestWindows[sessionId], nowMs);
  return {
    userWindow,
    sessionWindow
  };
}

function normalizeSessionWindows(
  windows: Record<string, RemoteQuotaWindow>,
  nowMs: number
): Record<string, RemoteQuotaWindow> {
  const minWindowStartedAtMs = alignToWindow(nowMs) - REMOTE_QUOTA_WINDOW_MS;
  const nextWindows: Record<string, RemoteQuotaWindow> = {};
  for (const [sessionId, window] of Object.entries(windows)) {
    const normalizedWindow = normalizeWindow(window, nowMs);
    if (normalizedWindow.count === 0 && normalizedWindow.windowStartedAtMs < alignToWindow(nowMs)) {
      continue;
    }
    if (normalizedWindow.windowStartedAtMs < minWindowStartedAtMs) {
      continue;
    }
    nextWindows[sessionId] = normalizedWindow;
  }
  return nextWindows;
}

function normalizeWindow(window: RemoteQuotaWindow | undefined, nowMs: number): RemoteQuotaWindow {
  const windowStartedAtMs = alignToWindow(nowMs);
  if (!window || window.windowStartedAtMs !== windowStartedAtMs) {
    return createWindow(nowMs);
  }
  return window;
}

function createWindow(nowMs: number): RemoteQuotaWindow {
  return {
    windowStartedAtMs: alignToWindow(nowMs),
    count: 0
  };
}

function incrementWindow(window: RemoteQuotaWindow): RemoteQuotaWindow {
  return {
    ...window,
    count: window.count + 1
  };
}

function alignToWindow(nowMs: number): number {
  return Math.floor(nowMs / REMOTE_QUOTA_WINDOW_MS) * REMOTE_QUOTA_WINDOW_MS;
}

function secondsUntilWindowReset(nowMs: number): number {
  const resetMs = alignToWindow(nowMs) + REMOTE_QUOTA_WINDOW_MS;
  return Math.max(1, Math.ceil((resetMs - nowMs) / 1000));
}

function reject(state: RemoteQuotaState, error: RemoteQuotaError): RemoteQuotaFailure {
  return {
    ok: false,
    error,
    state
  };
}
