import type { Context } from "hono";
import { readBillingSnapshot } from "../repositories/platform-repository";
import { chargeFromStream, chargeUsage, computeChargeSplit, ensurePlatformBootstrap, requireAuthUser } from "../services/platform-service";
import { MODEL_MAP, SUPPORTED_MODELS, type ChatCompletionRequest, type Env } from "../types/platform";
import {
  calculateCost,
  extractUsageCounters,
  getDashscopeApiBase,
  getRequestFlatUsdPerRequest,
  normalizeIdempotencyKey,
  openaiError,
  resolveMaxCompletionTokens,
  roundUsd,
  sanitizeResponseHeaders,
  withTrailingSlash,
  estimateUsage
} from "../utils/platform-utils";

export async function healthHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  return c.json({
    ok: true,
    data: {
      status: "ok",
      service: "nextclaw-provider-gateway-api",
      authRequired: true,
      billingMode: "usd-only"
    }
  });
}

export function modelsHandler(c: Context<{ Bindings: Env }>): Response {
  return c.json({
    object: "list",
    data: SUPPORTED_MODELS.map((model) => ({
      id: model.id,
      object: "model",
      created: 0,
      owned_by: "nextclaw",
      display_name: model.displayName
    }))
  });
}

export async function usageHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  const auth = await requireAuthUser(c);
  if (!auth.ok) {
    return auth.response;
  }

  const snapshot = await readBillingSnapshot(c.env.NEXTCLAW_PLATFORM_DB, auth.user.id);
  if (!snapshot) {
    return openaiError(c, 404, "User not found.", "user_not_found");
  }

  return c.json({
    object: "nextclaw.usage",
    data: {
      totalCostUsd: roundUsd(snapshot.user.free_used_usd + Math.max(0, snapshot.user.paid_balance_usd)),
      freeQuotaUsdLimit: roundUsd(snapshot.user.free_limit_usd),
      freeQuotaUsdUsed: roundUsd(snapshot.user.free_used_usd),
      freeQuotaUsdRemaining: roundUsd(Math.max(0, snapshot.user.free_limit_usd - snapshot.user.free_used_usd)),
      paidBalanceUsd: roundUsd(snapshot.user.paid_balance_usd),
      globalFreeUsdLimit: roundUsd(snapshot.globalFreeLimitUsd),
      globalFreeUsdUsed: roundUsd(snapshot.globalFreeUsedUsd),
      globalFreeUsdRemaining: roundUsd(Math.max(0, snapshot.globalFreeLimitUsd - snapshot.globalFreeUsedUsd)),
      updatedAt: snapshot.user.updated_at
    }
  });
}

export async function chatCompletionsHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);

  const auth = await requireAuthUser(c);
  if (!auth.ok) {
    return auth.response;
  }

  if (!c.env.DASHSCOPE_API_KEY || c.env.DASHSCOPE_API_KEY.trim().length === 0) {
    return openaiError(c, 503, "Upstream provider is not configured.", "service_unavailable");
  }

  let body: ChatCompletionRequest;
  try {
    body = await c.req.json<ChatCompletionRequest>();
  } catch {
    return openaiError(c, 400, "Invalid JSON payload.", "invalid_request_error");
  }

  if (typeof body.model !== "string" || body.model.trim().length === 0) {
    return openaiError(c, 400, "model is required.", "invalid_request_error");
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return openaiError(c, 400, "messages must be a non-empty array.", "invalid_request_error");
  }

  const requestedModel = body.model.trim();
  const modelSpec = MODEL_MAP.get(requestedModel);
  if (!modelSpec) {
    return openaiError(
      c,
      400,
      `Model '${requestedModel}' is not available in NextClaw catalog.`,
      "model_not_found"
    );
  }

  const usageEstimate = estimateUsage(body.messages, resolveMaxCompletionTokens(body));
  const estimatedCost = calculateCost(modelSpec, usageEstimate) + getRequestFlatUsdPerRequest(c.env);

  const precheckSnapshot = await readBillingSnapshot(c.env.NEXTCLAW_PLATFORM_DB, auth.user.id);
  if (!precheckSnapshot) {
    return openaiError(c, 404, "User not found.", "user_not_found");
  }

  const precheckSplit = computeChargeSplit(precheckSnapshot, estimatedCost);
  if (!precheckSplit) {
    return c.json(
      {
        error: {
          message: "Quota exceeded. Free quota and paid balance are both insufficient.",
          type: "insufficient_quota",
          param: null,
          code: "insufficient_quota"
        },
        usage: {
          freeQuotaUsdLimit: roundUsd(precheckSnapshot.user.free_limit_usd),
          freeQuotaUsdUsed: roundUsd(precheckSnapshot.user.free_used_usd),
          freeQuotaUsdRemaining: roundUsd(Math.max(0, precheckSnapshot.user.free_limit_usd - precheckSnapshot.user.free_used_usd)),
          paidBalanceUsd: roundUsd(precheckSnapshot.user.paid_balance_usd),
          globalFreeUsdRemaining: roundUsd(Math.max(0, precheckSnapshot.globalFreeLimitUsd - precheckSnapshot.globalFreeUsedUsd))
        }
      },
      429
    );
  }

  const upstreamUrl = new URL("chat/completions", withTrailingSlash(getDashscopeApiBase(c.env))).toString();
  const upstreamPayload: Record<string, unknown> = {
    ...body,
    model: modelSpec.upstreamModel
  };

  const upstreamResponse = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.DASHSCOPE_API_KEY.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(upstreamPayload)
  });

  const idempotencyKey = normalizeIdempotencyKey(c.req.header("x-idempotency-key"));
  const requestId = idempotencyKey
    ? `chat:${auth.user.id}:${idempotencyKey}`
    : crypto.randomUUID();

  if (body.stream === true && upstreamResponse.body) {
    const [clientStream, billingStream] = upstreamResponse.body.tee();
    if (upstreamResponse.ok) {
      c.executionCtx.waitUntil(
        chargeFromStream({
          env: c.env,
          userId: auth.user.id,
          modelSpec,
          stream: billingStream,
          fallback: usageEstimate,
          requestId
        })
      );
    }
    return new Response(clientStream, {
      status: upstreamResponse.status,
      headers: sanitizeResponseHeaders(upstreamResponse.headers)
    });
  }

  const rawText = await upstreamResponse.text();
  if (!upstreamResponse.ok) {
    return new Response(rawText, {
      status: upstreamResponse.status,
      headers: sanitizeResponseHeaders(upstreamResponse.headers)
    });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return openaiError(c, 502, "Upstream returned invalid JSON.", "upstream_invalid_response");
  }

  const usage = extractUsageCounters(parsed, usageEstimate);
  const charged = await chargeUsage(c.env, auth.user.id, modelSpec, usage, requestId);
  if (!charged.ok) {
    return c.json(
      {
        error: {
          message: "Quota exceeded before final settlement.",
          type: "insufficient_quota",
          param: null,
          code: "insufficient_quota"
        }
      },
      429
    );
  }

  parsed.model = requestedModel;
  return c.json(parsed);
}
