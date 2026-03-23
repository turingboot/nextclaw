import test from "node:test";
import assert from "node:assert/strict";

import {
  acquireRemoteBrowserConnection,
  consumeRemoteRequestQuota,
  createEmptyRemoteQuotaState,
  DEFAULT_REMOTE_PLATFORM_DAILY_DO_REQUEST_BUDGET,
  DEFAULT_REMOTE_PLATFORM_DAILY_RESERVE_PERCENT,
  DEFAULT_REMOTE_PLATFORM_DAILY_WORKER_REQUEST_BUDGET,
  DEFAULT_REMOTE_QUOTA_INSTANCE_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_SESSION_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_SESSION_DAILY_DO_REQUEST_UNITS,
  DEFAULT_REMOTE_QUOTA_SESSION_DAILY_WORKER_REQUEST_UNITS,
  DEFAULT_REMOTE_QUOTA_SESSION_REQUESTS_PER_MINUTE,
  DEFAULT_REMOTE_QUOTA_USER_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_USER_DAILY_DO_REQUEST_UNITS,
  DEFAULT_REMOTE_QUOTA_USER_DAILY_WORKER_REQUEST_UNITS,
  DEFAULT_REMOTE_QUOTA_USER_REQUESTS_PER_MINUTE,
  DEFAULT_REMOTE_QUOTA_WS_MESSAGE_LEASE_SIZE,
  leaseRemoteBrowserMessages,
  releaseRemoteBrowserConnection,
  REMOTE_BROWSER_CONNECT_COST,
  REMOTE_RUNTIME_REQUEST_COST
} from "../dist/remote-quota-policy.js";

const CONFIG = {
  userRequestsPerMinute: DEFAULT_REMOTE_QUOTA_USER_REQUESTS_PER_MINUTE,
  sessionRequestsPerMinute: DEFAULT_REMOTE_QUOTA_SESSION_REQUESTS_PER_MINUTE,
  userConnections: DEFAULT_REMOTE_QUOTA_USER_CONNECTIONS,
  sessionConnections: DEFAULT_REMOTE_QUOTA_SESSION_CONNECTIONS,
  instanceConnections: DEFAULT_REMOTE_QUOTA_INSTANCE_CONNECTIONS,
  platformDailyWorkerRequestBudget: DEFAULT_REMOTE_PLATFORM_DAILY_WORKER_REQUEST_BUDGET,
  platformDailyDoRequestBudgetMilli: DEFAULT_REMOTE_PLATFORM_DAILY_DO_REQUEST_BUDGET * 1000,
  platformDailyReservePercent: DEFAULT_REMOTE_PLATFORM_DAILY_RESERVE_PERCENT,
  userDailyWorkerRequestUnits: DEFAULT_REMOTE_QUOTA_USER_DAILY_WORKER_REQUEST_UNITS,
  sessionDailyWorkerRequestUnits: DEFAULT_REMOTE_QUOTA_SESSION_DAILY_WORKER_REQUEST_UNITS,
  userDailyDoRequestBudgetMilli: DEFAULT_REMOTE_QUOTA_USER_DAILY_DO_REQUEST_UNITS * 1000,
  sessionDailyDoRequestBudgetMilli: DEFAULT_REMOTE_QUOTA_SESSION_DAILY_DO_REQUEST_UNITS * 1000,
  wsMessageLeaseSize: DEFAULT_REMOTE_QUOTA_WS_MESSAGE_LEASE_SIZE
};

test("session request quota rejects after the configured per-minute budget", () => {
  const nowMs = Date.UTC(2026, 2, 24, 12, 0, 0);
  let state = createEmptyRemoteQuotaState(nowMs);

  for (let index = 0; index < CONFIG.sessionRequestsPerMinute; index += 1) {
    const decision = consumeRemoteRequestQuota(state, CONFIG, {
      nowMs: nowMs + index,
      userId: "user-a",
      sessionId: "session-a",
      operationCost: REMOTE_RUNTIME_REQUEST_COST
    });
    assert.equal(decision.ok, true);
    state = decision.state;
  }

  const rejected = consumeRemoteRequestQuota(state, CONFIG, {
    nowMs: nowMs + 1_000,
    userId: "user-a",
    sessionId: "session-a",
    operationCost: REMOTE_RUNTIME_REQUEST_COST
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, "REMOTE_SESSION_RATE_LIMITED");
});

test("user request quota aggregates across sessions", () => {
  const nowMs = Date.UTC(2026, 2, 24, 12, 0, 0);
  let state = createEmptyRemoteQuotaState(nowMs);

  for (let index = 0; index < CONFIG.userRequestsPerMinute; index += 1) {
    const decision = consumeRemoteRequestQuota(state, CONFIG, {
      nowMs: nowMs + index,
      userId: "user-a",
      sessionId: `session-${index}`,
      operationCost: REMOTE_RUNTIME_REQUEST_COST
    });
    assert.equal(decision.ok, true);
    state = decision.state;
  }

  const rejected = consumeRemoteRequestQuota(state, CONFIG, {
    nowMs: nowMs + 2_000,
    userId: "user-a",
    sessionId: "another-session",
    operationCost: REMOTE_RUNTIME_REQUEST_COST
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, "REMOTE_USER_RATE_LIMITED");
});

test("connection quota enforces session, instance, and user caps", () => {
  const nowMs = Date.UTC(2026, 2, 24, 12, 0, 0);
  let state = createEmptyRemoteQuotaState(nowMs);

  for (let index = 0; index < CONFIG.sessionConnections; index += 1) {
    const decision = acquireRemoteBrowserConnection(state, CONFIG, {
      nowMs: nowMs + index,
      userId: "user-a",
      ticket: `session-ticket-${index}`,
      clientId: `session-client-${index}`,
      sessionId: "session-a",
      instanceId: "instance-a"
    });
    assert.equal(decision.ok, true);
    state = decision.state;
  }

  const rejectedBySession = acquireRemoteBrowserConnection(state, CONFIG, {
    nowMs,
    userId: "user-a",
    ticket: "session-ticket-over",
    clientId: "session-client-over",
    sessionId: "session-a",
    instanceId: "instance-b"
  });
  assert.equal(rejectedBySession.ok, false);
  assert.equal(rejectedBySession.error.code, "REMOTE_SESSION_CONNECTION_LIMIT");

  let instanceState = createEmptyRemoteQuotaState(nowMs);
  for (let index = 0; index < CONFIG.instanceConnections; index += 1) {
    const decision = acquireRemoteBrowserConnection(instanceState, CONFIG, {
      nowMs: nowMs + index,
      userId: "user-a",
      ticket: `instance-ticket-${index}`,
      clientId: `instance-client-${index}`,
      sessionId: `instance-session-${index}`,
      instanceId: "instance-shared"
    });
    assert.equal(decision.ok, true);
    instanceState = decision.state;
  }

  const rejectedByInstance = acquireRemoteBrowserConnection(instanceState, CONFIG, {
    nowMs,
    userId: "user-a",
    ticket: "instance-ticket-over",
    clientId: "instance-client-over",
    sessionId: "instance-session-over",
    instanceId: "instance-shared"
  });
  assert.equal(rejectedByInstance.ok, false);
  assert.equal(rejectedByInstance.error.code, "REMOTE_INSTANCE_CONNECTION_LIMIT");

  let userState = createEmptyRemoteQuotaState(nowMs);
  for (let index = 0; index < CONFIG.userConnections; index += 1) {
    const decision = acquireRemoteBrowserConnection(userState, CONFIG, {
      nowMs: nowMs + index,
      userId: "user-a",
      ticket: `user-ticket-${index}`,
      clientId: `user-client-${index}`,
      sessionId: `user-session-${index}`,
      instanceId: `user-instance-${index}`
    });
    assert.equal(decision.ok, true);
    userState = decision.state;
  }

  const rejectedByUser = acquireRemoteBrowserConnection(userState, CONFIG, {
    nowMs,
    userId: "user-a",
    ticket: "user-ticket-over",
    clientId: "user-client-over",
    sessionId: "user-session-over",
    instanceId: "user-instance-over"
  });
  assert.equal(rejectedByUser.ok, false);
  assert.equal(rejectedByUser.error.code, "REMOTE_USER_CONNECTION_LIMIT");
});

test("releasing a browser connection frees the ticket for reuse", () => {
  const nowMs = Date.UTC(2026, 2, 24, 12, 0, 0);
  const acquired = acquireRemoteBrowserConnection(createEmptyRemoteQuotaState(nowMs), CONFIG, {
    nowMs,
    userId: "user-a",
    ticket: "ticket-a",
    clientId: "client-a",
    sessionId: "session-a",
    instanceId: "instance-a"
  });
  assert.equal(acquired.ok, true);

  const released = releaseRemoteBrowserConnection(acquired.state, nowMs + 1_000, "user-a", "ticket-a");
  assert.equal(released.ok, true);
  assert.equal(released.data.released, true);

  const reacquired = acquireRemoteBrowserConnection(released.state, CONFIG, {
    nowMs: nowMs + 2_000,
    userId: "user-a",
    ticket: "ticket-b",
    clientId: "client-b",
    sessionId: "session-a",
    instanceId: "instance-a"
  });
  assert.equal(reacquired.ok, true);
});

test("platform daily worker budget rejects requests after the safety waterline", () => {
  const nowMs = Date.UTC(2026, 2, 24, 0, 0, 0);
  let state = createEmptyRemoteQuotaState(nowMs);
  const limitedConfig = {
    ...CONFIG,
    platformDailyWorkerRequestBudget: 10,
    platformDailyReservePercent: 20
  };

  for (let index = 0; index < 8; index += 1) {
    const decision = consumeRemoteRequestQuota(state, limitedConfig, {
      nowMs: nowMs + index,
      userId: "user-a",
      sessionId: `session-${index}`,
      operationCost: REMOTE_RUNTIME_REQUEST_COST
    });
    assert.equal(decision.ok, true);
    state = decision.state;
  }

  const rejected = consumeRemoteRequestQuota(state, limitedConfig, {
    nowMs: nowMs + 9_000,
    userId: "user-a",
    sessionId: "session-over",
    operationCost: REMOTE_RUNTIME_REQUEST_COST
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, "REMOTE_PLATFORM_WORKER_DAILY_BUDGET_EXCEEDED");
});

test("user daily worker budget stops one user before it can monopolize the platform", () => {
  const nowMs = Date.UTC(2026, 2, 24, 0, 0, 0);
  let state = createEmptyRemoteQuotaState(nowMs);
  const limitedConfig = {
    ...CONFIG,
    userDailyWorkerRequestUnits: 3,
    sessionDailyWorkerRequestUnits: 3
  };

  for (let index = 0; index < 3; index += 1) {
    const decision = consumeRemoteRequestQuota(state, limitedConfig, {
      nowMs: nowMs + index,
      userId: "user-a",
      sessionId: `session-${index}`,
      operationCost: REMOTE_RUNTIME_REQUEST_COST
    });
    assert.equal(decision.ok, true);
    state = decision.state;
  }

  const rejected = consumeRemoteRequestQuota(state, limitedConfig, {
    nowMs: nowMs + 4_000,
    userId: "user-a",
    sessionId: "session-over",
    operationCost: REMOTE_RUNTIME_REQUEST_COST
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, "REMOTE_USER_DAILY_WORKER_BUDGET_EXCEEDED");
});

test("ws lease batches multiple browser messages under one quota decision", () => {
  const nowMs = Date.UTC(2026, 2, 24, 12, 0, 0);
  const limitedConfig = {
    ...CONFIG,
    userRequestsPerMinute: 5,
    sessionRequestsPerMinute: 5
  };
  const decision = leaseRemoteBrowserMessages(createEmptyRemoteQuotaState(nowMs), limitedConfig, {
    nowMs,
    userId: "user-a",
    sessionId: "session-a",
    requestedMessages: 3
  });
  assert.equal(decision.ok, true);
  assert.equal(decision.data.grantedMessages, 3);

  const resized = leaseRemoteBrowserMessages(decision.state, limitedConfig, {
    nowMs: nowMs + 1_000,
    userId: "user-a",
    sessionId: "session-a",
    requestedMessages: 3
  });
  assert.equal(resized.ok, true);
  assert.equal(resized.data.grantedMessages, 2);
});

test("browser connection admission also respects daily budgets", () => {
  const nowMs = Date.UTC(2026, 2, 24, 12, 0, 0);
  const limitedConfig = {
    ...CONFIG,
    userDailyWorkerRequestUnits: REMOTE_BROWSER_CONNECT_COST.workerRequestUnits,
    sessionDailyWorkerRequestUnits: REMOTE_BROWSER_CONNECT_COST.workerRequestUnits,
    userDailyDoRequestBudgetMilli: REMOTE_BROWSER_CONNECT_COST.durableObjectMilliUnits,
    sessionDailyDoRequestBudgetMilli: REMOTE_BROWSER_CONNECT_COST.durableObjectMilliUnits
  };

  const admitted = acquireRemoteBrowserConnection(createEmptyRemoteQuotaState(nowMs), limitedConfig, {
    nowMs,
    userId: "user-a",
    ticket: "ticket-a",
    clientId: "client-a",
    sessionId: "session-a",
    instanceId: "instance-a"
  });
  assert.equal(admitted.ok, true);

  const rejected = acquireRemoteBrowserConnection(admitted.state, limitedConfig, {
    nowMs: nowMs + 1_000,
    userId: "user-a",
    ticket: "ticket-b",
    clientId: "client-b",
    sessionId: "session-b",
    instanceId: "instance-b"
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, "REMOTE_USER_DAILY_WORKER_BUDGET_EXCEEDED");
});
