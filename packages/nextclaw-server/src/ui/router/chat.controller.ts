import type { Context } from "hono";
import * as NextclawCore from "@nextclaw/core";
import { loadConfigOrDefault } from "../config.js";
import type {
  ChatCapabilitiesView,
  ChatCommandsView,
  ChatRunListView,
  ChatRunView,
  ChatTurnRequest,
  ChatTurnStopRequest,
  ChatTurnStopResult,
  ChatTurnStreamEvent
} from "../types.js";
import { err, formatUserFacingError, isRecord, ok, readJson, readNonEmptyString } from "./response.js";
import {
  buildChatSessionTypesView,
  buildChatTurnView,
  buildChatTurnViewFromRun,
  createChatRunId,
  readChatRunStates,
  resolveAgentIdFromSessionKey,
  toSseFrame
} from "./chat-utils.js";
import type { UiRouterOptions } from "./types.js";

export class ChatRoutesController {
  constructor(private readonly options: UiRouterOptions) {}

  readonly getCapabilities = async (c: Context) => {
    const chatRuntime = this.options.chatRuntime;
    if (!chatRuntime) {
      return c.json(err("NOT_AVAILABLE", "chat runtime unavailable"), 503);
    }
    const query = c.req.query();
    const params = {
      sessionKey: readNonEmptyString(query.sessionKey),
      agentId: readNonEmptyString(query.agentId)
    };
    try {
      const capabilities: ChatCapabilitiesView = chatRuntime.getCapabilities
        ? await chatRuntime.getCapabilities(params)
        : { stopSupported: Boolean(chatRuntime.stopTurn) };
      return c.json(ok(capabilities));
    } catch (error) {
      return c.json(err("CHAT_RUNTIME_FAILED", String(error)), 500);
    }
  };

  readonly getSessionTypes = async (c: Context) => {
    try {
      const payload = await buildChatSessionTypesView(this.options.chatRuntime);
      return c.json(ok(payload));
    } catch (error) {
      return c.json(err("CHAT_SESSION_TYPES_FAILED", String(error)), 500);
    }
  };

  readonly getCommands = async (c: Context) => {
    try {
      const config = loadConfigOrDefault(this.options.configPath);
      const registry = new NextclawCore.CommandRegistry(config);
      const commands = registry.listSlashCommands().map((command) => ({
        name: command.name,
        description: command.description,
        ...(Array.isArray(command.options) && command.options.length > 0
          ? {
              options: command.options.map((option) => ({
                name: option.name,
                description: option.description,
                type: option.type,
                ...(option.required === true ? { required: true } : {})
              }))
            }
          : {})
      }));
      const payload: ChatCommandsView = {
        commands,
        total: commands.length
      };
      return c.json(ok(payload));
    } catch (error) {
      return c.json(err("CHAT_COMMANDS_FAILED", String(error)), 500);
    }
  };

  readonly processTurn = async (c: Context) => {
    if (!this.options.chatRuntime) {
      return c.json(err("NOT_AVAILABLE", "chat runtime unavailable"), 503);
    }

    const body = await readJson<Record<string, unknown>>(c.req.raw);
    if (!body.ok) {
      return c.json(err("INVALID_BODY", "invalid json body"), 400);
    }

    const message = readNonEmptyString(body.data.message);
    if (!message) {
      return c.json(err("INVALID_BODY", "message is required"), 400);
    }

    const sessionKey =
      readNonEmptyString(body.data.sessionKey) ??
      `ui:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
    const requestedAt = new Date();
    const startedAtMs = requestedAt.getTime();

    const metadata = isRecord(body.data.metadata) ? body.data.metadata : undefined;
    const requestedAgentId = readNonEmptyString(body.data.agentId) ?? resolveAgentIdFromSessionKey(sessionKey);
    const requestedModel = readNonEmptyString(body.data.model);
    const request: ChatTurnRequest = {
      message,
      sessionKey,
      channel: readNonEmptyString(body.data.channel) ?? "ui",
      chatId: readNonEmptyString(body.data.chatId) ?? "web-ui",
      ...(requestedAgentId ? { agentId: requestedAgentId } : {}),
      ...(requestedModel ? { model: requestedModel } : {}),
      ...(metadata ? { metadata } : {})
    };

    try {
      const result = await this.options.chatRuntime.processTurn(request);
      const response = buildChatTurnView({
        result,
        fallbackSessionKey: sessionKey,
        requestedAgentId,
        requestedModel,
        requestedAt,
        startedAtMs
      });
      this.options.publish({ type: "config.updated", payload: { path: "session" } });
      return c.json(ok(response));
    } catch (error) {
      return c.json(err("CHAT_TURN_FAILED", formatUserFacingError(error)), 500);
    }
  };

  readonly stopTurn = async (c: Context) => {
    const chatRuntime = this.options.chatRuntime;
    if (!chatRuntime?.stopTurn) {
      return c.json(err("NOT_AVAILABLE", "chat turn stop is not supported by runtime"), 503);
    }

    const body = await readJson<ChatTurnStopRequest>(c.req.raw);
    if (!body.ok || !body.data || typeof body.data !== "object") {
      return c.json(err("INVALID_BODY", "invalid json body"), 400);
    }

    const runId = readNonEmptyString(body.data.runId);
    if (!runId) {
      return c.json(err("INVALID_BODY", "runId is required"), 400);
    }

    const request: ChatTurnStopRequest = {
      runId,
      ...(readNonEmptyString(body.data.sessionKey) ? { sessionKey: readNonEmptyString(body.data.sessionKey) } : {}),
      ...(readNonEmptyString(body.data.agentId) ? { agentId: readNonEmptyString(body.data.agentId) } : {})
    };

    try {
      const result: ChatTurnStopResult = await chatRuntime.stopTurn(request);
      return c.json(ok(result));
    } catch (error) {
      return c.json(err("CHAT_TURN_STOP_FAILED", String(error)), 500);
    }
  };

  readonly streamTurn = async (c: Context): Promise<Response> => {
    const chatRuntime = this.options.chatRuntime;
    if (!chatRuntime) {
      return c.json(err("NOT_AVAILABLE", "chat runtime unavailable"), 503);
    }

    const body = await readJson<Record<string, unknown>>(c.req.raw);
    if (!body.ok) {
      return c.json(err("INVALID_BODY", "invalid json body"), 400);
    }

    const message = readNonEmptyString(body.data.message);
    if (!message) {
      return c.json(err("INVALID_BODY", "message is required"), 400);
    }

    const sessionKey =
      readNonEmptyString(body.data.sessionKey) ??
      `ui:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
    const requestedAt = new Date();
    const startedAtMs = requestedAt.getTime();
    const metadata = isRecord(body.data.metadata) ? body.data.metadata : undefined;
    const requestedAgentId = readNonEmptyString(body.data.agentId) ?? resolveAgentIdFromSessionKey(sessionKey);
    const requestedModel = readNonEmptyString(body.data.model);
    let runId = createChatRunId();
    const supportsManagedRuns = Boolean(chatRuntime.startTurnRun && chatRuntime.streamRun);
    let stopCapabilities: ChatCapabilitiesView = { stopSupported: Boolean(chatRuntime.stopTurn) };
    if (chatRuntime.getCapabilities) {
      try {
        stopCapabilities = await chatRuntime.getCapabilities({
          sessionKey,
          ...(requestedAgentId ? { agentId: requestedAgentId } : {})
        });
      } catch {
        stopCapabilities = {
          stopSupported: false,
          stopReason: "failed to resolve runtime stop capability"
        };
      }
    }
    const request: ChatTurnRequest = {
      message,
      sessionKey,
      channel: readNonEmptyString(body.data.channel) ?? "ui",
      chatId: readNonEmptyString(body.data.chatId) ?? "web-ui",
      runId,
      ...(requestedAgentId ? { agentId: requestedAgentId } : {}),
      ...(requestedModel ? { model: requestedModel } : {}),
      ...(metadata ? { metadata } : {})
    };

    let managedRun: ChatRunView | null = null;
    if (supportsManagedRuns && chatRuntime.startTurnRun) {
      try {
        managedRun = await chatRuntime.startTurnRun(request);
      } catch (error) {
        return c.json(err("CHAT_TURN_FAILED", formatUserFacingError(error)), 500);
      }
      if (readNonEmptyString(managedRun.runId)) {
        runId = readNonEmptyString(managedRun.runId) as string;
      }
      stopCapabilities = {
        stopSupported: managedRun.stopSupported,
        ...(readNonEmptyString(managedRun.stopReason)
          ? { stopReason: readNonEmptyString(managedRun.stopReason) }
          : {})
      };
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const push = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(toSseFrame(event, data)));
        };

        try {
          push("ready", {
            sessionKey: managedRun?.sessionKey ?? sessionKey,
            requestedAt: managedRun?.requestedAt ?? requestedAt.toISOString(),
            runId,
            stopSupported: stopCapabilities.stopSupported,
            ...(readNonEmptyString(stopCapabilities.stopReason)
              ? { stopReason: readNonEmptyString(stopCapabilities.stopReason) }
              : {})
          });

          if (supportsManagedRuns && chatRuntime.streamRun) {
            let hasFinal = false;
            for await (const event of chatRuntime.streamRun({ runId })) {
              const typed = event as ChatTurnStreamEvent;
              if (typed.type === "delta") {
                if (typed.delta) {
                  push("delta", { delta: typed.delta });
                }
                continue;
              }
              if (typed.type === "session_event") {
                push("session_event", typed.event);
                continue;
              }
              if (typed.type === "final") {
                const latestRun = chatRuntime.getRun ? await chatRuntime.getRun({ runId }) : null;
                const response = latestRun
                  ? buildChatTurnViewFromRun({
                      run: latestRun,
                      fallbackSessionKey: sessionKey,
                      fallbackAgentId: requestedAgentId,
                      fallbackModel: requestedModel,
                      fallbackReply: typed.result.reply
                    })
                  : buildChatTurnView({
                      result: typed.result,
                      fallbackSessionKey: sessionKey,
                      requestedAgentId,
                      requestedModel,
                      requestedAt,
                      startedAtMs
                    });
                hasFinal = true;
                push("final", response);
                this.options.publish({ type: "config.updated", payload: { path: "session" } });
                continue;
              }
              if (typed.type === "error") {
                push("error", {
                  code: "CHAT_TURN_FAILED",
                  message: formatUserFacingError(typed.error)
                });
                return;
              }
            }
            if (!hasFinal) {
              push("error", {
                code: "CHAT_TURN_FAILED",
                message: "stream ended without a final result"
              });
              return;
            }
            push("done", { ok: true });
            return;
          }

          const streamTurn = chatRuntime.processTurnStream;
          if (!streamTurn) {
            const result = await chatRuntime.processTurn(request);
            const response = buildChatTurnView({
              result,
              fallbackSessionKey: sessionKey,
              requestedAgentId,
              requestedModel,
              requestedAt,
              startedAtMs
            });
            push("final", response);
            this.options.publish({ type: "config.updated", payload: { path: "session" } });
            push("done", { ok: true });
            return;
          }

          let hasFinal = false;
          for await (const event of streamTurn(request)) {
            const typed = event as ChatTurnStreamEvent;
            if (typed.type === "delta") {
              if (typed.delta) {
                push("delta", { delta: typed.delta });
              }
              continue;
            }
            if (typed.type === "session_event") {
              push("session_event", typed.event);
              continue;
            }
            if (typed.type === "final") {
              const response = buildChatTurnView({
                result: typed.result,
                fallbackSessionKey: sessionKey,
                requestedAgentId,
                requestedModel,
                requestedAt,
                startedAtMs
              });
              hasFinal = true;
              push("final", response);
              this.options.publish({ type: "config.updated", payload: { path: "session" } });
              continue;
            }
            if (typed.type === "error") {
              push("error", {
                code: "CHAT_TURN_FAILED",
                message: formatUserFacingError(typed.error)
              });
              return;
            }
          }

          if (!hasFinal) {
            push("error", {
              code: "CHAT_TURN_FAILED",
              message: "stream ended without a final result"
            });
            return;
          }

          push("done", { ok: true });
        } catch (error) {
          push("error", {
            code: "CHAT_TURN_FAILED",
            message: formatUserFacingError(error)
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  };

  readonly listRuns = async (c: Context) => {
    const chatRuntime = this.options.chatRuntime;
    if (!chatRuntime?.listRuns) {
      return c.json(err("NOT_AVAILABLE", "chat run management unavailable"), 503);
    }
    const query = c.req.query();
    const sessionKey = readNonEmptyString(query.sessionKey);
    const states = readChatRunStates(query.states);
    const limit = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : undefined;
    try {
      const data = await chatRuntime.listRuns({
        ...(sessionKey ? { sessionKey } : {}),
        ...(states ? { states } : {}),
        ...(Number.isFinite(limit) ? { limit } : {})
      });
      return c.json(ok(data satisfies ChatRunListView));
    } catch (error) {
      return c.json(err("CHAT_RUN_QUERY_FAILED", String(error)), 500);
    }
  };

  readonly getRun = async (c: Context) => {
    const chatRuntime = this.options.chatRuntime;
    if (!chatRuntime?.getRun) {
      return c.json(err("NOT_AVAILABLE", "chat run management unavailable"), 503);
    }
    const runId = readNonEmptyString(c.req.param("runId"));
    if (!runId) {
      return c.json(err("INVALID_PATH", "runId is required"), 400);
    }
    try {
      const run = await chatRuntime.getRun({ runId });
      if (!run) {
        return c.json(err("NOT_FOUND", `chat run not found: ${runId}`), 404);
      }
      return c.json(ok(run));
    } catch (error) {
      return c.json(err("CHAT_RUN_QUERY_FAILED", String(error)), 500);
    }
  };

  readonly streamRun = async (c: Context): Promise<Response> => {
    const chatRuntime = this.options.chatRuntime;
    const streamRun = chatRuntime?.streamRun;
    const getRun = chatRuntime?.getRun;
    if (!streamRun || !getRun) {
      return c.json(err("NOT_AVAILABLE", "chat run stream unavailable"), 503);
    }

    const runId = readNonEmptyString(c.req.param("runId"));
    if (!runId) {
      return c.json(err("INVALID_PATH", "runId is required"), 400);
    }

    const query = c.req.query();
    const fromEventIndex =
      typeof query.fromEventIndex === "string" ? Number.parseInt(query.fromEventIndex, 10) : undefined;
    const run = await getRun({ runId });
    if (!run) {
      return c.json(err("NOT_FOUND", `chat run not found: ${runId}`), 404);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const push = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(toSseFrame(event, data)));
        };
        try {
          push("ready", {
            sessionKey: run.sessionKey,
            requestedAt: run.requestedAt,
            runId: run.runId,
            stopSupported: run.stopSupported,
            ...(readNonEmptyString(run.stopReason) ? { stopReason: readNonEmptyString(run.stopReason) } : {})
          });

          let hasFinal = false;
          for await (const event of streamRun({
            runId: run.runId,
            ...(Number.isFinite(fromEventIndex) ? { fromEventIndex } : {})
          })) {
            const typed = event as ChatTurnStreamEvent;
            if (typed.type === "delta") {
              if (typed.delta) {
                push("delta", { delta: typed.delta });
              }
              continue;
            }
            if (typed.type === "session_event") {
              push("session_event", typed.event);
              continue;
            }
            if (typed.type === "final") {
              const latestRun = await getRun({ runId: run.runId });
              const response = latestRun
                ? buildChatTurnViewFromRun({
                    run: latestRun,
                    fallbackSessionKey: run.sessionKey,
                    fallbackAgentId: run.agentId,
                    fallbackModel: run.model,
                    fallbackReply: typed.result.reply
                  })
                : buildChatTurnView({
                    result: typed.result,
                    fallbackSessionKey: run.sessionKey,
                    requestedAgentId: run.agentId,
                    requestedModel: run.model,
                    requestedAt: new Date(run.requestedAt),
                    startedAtMs: Date.parse(run.requestedAt)
                  });
              hasFinal = true;
              push("final", response);
              continue;
            }
            if (typed.type === "error") {
              push("error", {
                code: "CHAT_TURN_FAILED",
                message: formatUserFacingError(typed.error)
              });
              return;
            }
          }

          if (!hasFinal) {
            const latestRun = await getRun({ runId: run.runId });
            if (latestRun?.state === "failed") {
              push("error", {
                code: "CHAT_TURN_FAILED",
                message: formatUserFacingError(latestRun.error ?? "chat run failed")
              });
              return;
            }
          }

          push("done", { ok: true });
        } catch (error) {
          push("error", {
            code: "CHAT_TURN_FAILED",
            message: formatUserFacingError(error)
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  };
}
