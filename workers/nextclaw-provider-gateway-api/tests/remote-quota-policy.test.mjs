import test from "node:test";
import assert from "node:assert/strict";

import {
  acquireRemoteBrowserConnection,
  consumeRemoteRequestQuota,
  createEmptyRemoteQuotaState,
  DEFAULT_REMOTE_QUOTA_INSTANCE_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_SESSION_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_SESSION_REQUESTS_PER_MINUTE,
  DEFAULT_REMOTE_QUOTA_USER_CONNECTIONS,
  DEFAULT_REMOTE_QUOTA_USER_REQUESTS_PER_MINUTE,
  releaseRemoteBrowserConnection
} from "../dist/remote-quota-policy.js";

const CONFIG = {
  userRequestsPerMinute: DEFAULT_REMOTE_QUOTA_USER_REQUESTS_PER_MINUTE,
  sessionRequestsPerMinute: DEFAULT_REMOTE_QUOTA_SESSION_REQUESTS_PER_MINUTE,
  userConnections: DEFAULT_REMOTE_QUOTA_USER_CONNECTIONS,
  sessionConnections: DEFAULT_REMOTE_QUOTA_SESSION_CONNECTIONS,
  instanceConnections: DEFAULT_REMOTE_QUOTA_INSTANCE_CONNECTIONS
};

test("session request quota rejects after the configured per-minute budget", () => {
  const nowMs = Date.UTC(2026, 2, 24, 12, 0, 0);
  let state = createEmptyRemoteQuotaState(nowMs);

  for (let index = 0; index < CONFIG.sessionRequestsPerMinute; index += 1) {
    const decision = consumeRemoteRequestQuota(state, CONFIG, {
      nowMs: nowMs + index,
      sessionId: "session-a"
    });
    assert.equal(decision.ok, true);
    state = decision.state;
  }

  const rejected = consumeRemoteRequestQuota(state, CONFIG, {
    nowMs: nowMs + 1_000,
    sessionId: "session-a"
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
      sessionId: `session-${index}`
    });
    assert.equal(decision.ok, true);
    state = decision.state;
  }

  const rejected = consumeRemoteRequestQuota(state, CONFIG, {
    nowMs: nowMs + 2_000,
    sessionId: "another-session"
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
    ticket: "ticket-a",
    clientId: "client-a",
    sessionId: "session-a",
    instanceId: "instance-a"
  });
  assert.equal(acquired.ok, true);

  const released = releaseRemoteBrowserConnection(acquired.state, nowMs + 1_000, "ticket-a");
  assert.equal(released.ok, true);
  assert.equal(released.data.released, true);

  const reacquired = acquireRemoteBrowserConnection(released.state, CONFIG, {
    nowMs: nowMs + 2_000,
    ticket: "ticket-b",
    clientId: "client-b",
    sessionId: "session-a",
    instanceId: "instance-a"
  });
  assert.equal(reacquired.ok, true);
});
