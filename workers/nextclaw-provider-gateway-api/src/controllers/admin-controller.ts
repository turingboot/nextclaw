import type { Context } from "hono";
import type { Env, RechargeIntentRow, UserRow } from "../types/platform";
import {
  appendAuditLog,
  appendLedger,
  countRechargeIntentsByStatus,
  countUsers,
  getRechargeIntentById,
  getUserById,
  readPlatformNumberSetting,
  toRechargeIntentView,
  toUserPublicView,
  writePlatformNumberSetting
} from "../repositories/platform-repository";
import { ensurePlatformBootstrap, requireAdminUser } from "../services/platform-service";
import {
  apiError,
  decodeCursorToken,
  getGlobalFreeLimit,
  optionalTrimmedString,
  paginateRows,
  parseBoundedInt,
  readJson,
  readNumber,
  readUnknown,
  roundUsd
} from "../utils/platform-utils";

export async function adminOverviewHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  const admin = await requireAdminUser(c);
  if (!admin.ok) {
    return admin.response;
  }

  const globalFreeLimitUsd = await readPlatformNumberSetting(c.env.NEXTCLAW_PLATFORM_DB, "global_free_limit_usd", getGlobalFreeLimit(c.env));
  const globalFreeUsedUsd = await readPlatformNumberSetting(c.env.NEXTCLAW_PLATFORM_DB, "global_free_used_usd", 0);
  const userCount = await countUsers(c.env.NEXTCLAW_PLATFORM_DB);
  const pendingRechargeIntents = await countRechargeIntentsByStatus(c.env.NEXTCLAW_PLATFORM_DB, "pending");

  return c.json({
    ok: true,
    data: {
      globalFreeLimitUsd: roundUsd(globalFreeLimitUsd),
      globalFreeUsedUsd: roundUsd(globalFreeUsedUsd),
      globalFreeRemainingUsd: roundUsd(Math.max(0, globalFreeLimitUsd - globalFreeUsedUsd)),
      userCount,
      pendingRechargeIntents
    }
  });
}

export async function adminUsersHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  const admin = await requireAdminUser(c);
  if (!admin.ok) {
    return admin.response;
  }

  const limit = parseBoundedInt(c.req.query("limit"), 50, 1, 500);
  const query = optionalTrimmedString(c.req.query("q") ?? "");
  const cursor = decodeCursorToken(c.req.query("cursor"));

  const conditions: string[] = [];
  const binds: unknown[] = [];
  if (query) {
    conditions.push("email LIKE ?");
    binds.push(`%${query}%`);
  }
  if (cursor) {
    conditions.push("(created_at < ? OR (created_at = ? AND id < ?))");
    binds.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT id, email, password_hash, password_salt, role,
                      free_limit_usd, free_used_usd, paid_balance_usd,
                      created_at, updated_at
                 FROM users
                 ${whereClause}
                ORDER BY created_at DESC, id DESC
                LIMIT ?`;

  const result = await c.env.NEXTCLAW_PLATFORM_DB.prepare(sql)
    .bind(...binds, limit + 1)
    .all<UserRow>();
  const pagination = paginateRows(result.results ?? [], limit);

  return c.json({
    ok: true,
    data: {
      items: pagination.items.map(toUserPublicView),
      nextCursor: pagination.nextCursor,
      hasMore: pagination.hasMore
    }
  });
}

export async function patchAdminUserHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  const admin = await requireAdminUser(c);
  if (!admin.ok) {
    return admin.response;
  }

  const userId = c.req.param("userId");
  const userBefore = await getUserById(c.env.NEXTCLAW_PLATFORM_DB, userId);
  if (!userBefore) {
    return apiError(c, 404, "USER_NOT_FOUND", "User not found.");
  }

  const body = await readJson(c);
  const freeLimitUsdRaw = readUnknown(body, "freeLimitUsd");
  const paidBalanceDeltaUsdRaw = readUnknown(body, "paidBalanceDeltaUsd");

  let changed = false;
  const now = new Date().toISOString();

  if (typeof freeLimitUsdRaw === "number" && Number.isFinite(freeLimitUsdRaw) && freeLimitUsdRaw >= 0) {
    const nextFreeLimitUsd = roundUsd(freeLimitUsdRaw);
    const changedFree = await c.env.NEXTCLAW_PLATFORM_DB.prepare(
      "UPDATE users SET free_limit_usd = ?, updated_at = ? WHERE id = ?"
    )
      .bind(nextFreeLimitUsd, now, userId)
      .run();
    if (changedFree.success && (changedFree.meta.changes ?? 0) > 0) {
      changed = true;
    }
  }

  if (typeof paidBalanceDeltaUsdRaw === "number" && Number.isFinite(paidBalanceDeltaUsdRaw) && paidBalanceDeltaUsdRaw !== 0) {
    const delta = roundUsd(paidBalanceDeltaUsdRaw);
    if (delta > 0) {
      const changedBalance = await c.env.NEXTCLAW_PLATFORM_DB.prepare(
        "UPDATE users SET paid_balance_usd = paid_balance_usd + ?, updated_at = ? WHERE id = ?"
      )
        .bind(delta, now, userId)
        .run();
      if (changedBalance.success && (changedBalance.meta.changes ?? 0) > 0) {
        changed = true;
        await appendLedger(c.env.NEXTCLAW_PLATFORM_DB, {
          id: crypto.randomUUID(),
          userId,
          kind: "admin_adjust",
          amountUsd: roundUsd(delta),
          freeAmountUsd: 0,
          paidAmountUsd: roundUsd(delta),
          model: null,
          promptTokens: 0,
          completionTokens: 0,
          requestId: `admin-adjust:${crypto.randomUUID()}`,
          note: `Admin recharge +${delta.toFixed(6)} USD`
        });
      }
    }

    if (delta < 0) {
      const abs = Math.abs(delta);
      const changedBalance = await c.env.NEXTCLAW_PLATFORM_DB.prepare(
        "UPDATE users SET paid_balance_usd = paid_balance_usd - ?, updated_at = ? WHERE id = ? AND paid_balance_usd >= ?"
      )
        .bind(abs, now, userId, abs)
        .run();
      if (changedBalance.success && (changedBalance.meta.changes ?? 0) > 0) {
        changed = true;
        await appendLedger(c.env.NEXTCLAW_PLATFORM_DB, {
          id: crypto.randomUUID(),
          userId,
          kind: "admin_adjust",
          amountUsd: -roundUsd(abs),
          freeAmountUsd: 0,
          paidAmountUsd: -roundUsd(abs),
          model: null,
          promptTokens: 0,
          completionTokens: 0,
          requestId: `admin-adjust:${crypto.randomUUID()}`,
          note: `Admin deduction -${abs.toFixed(6)} USD`
        });
      }
    }
  }

  const userAfter = await getUserById(c.env.NEXTCLAW_PLATFORM_DB, userId);
  if (!userAfter) {
    return apiError(c, 500, "USER_NOT_FOUND_AFTER_UPDATE", "User cannot be loaded after update.");
  }

  if (changed) {
    await appendAuditLog(c.env.NEXTCLAW_PLATFORM_DB, {
      actorUserId: admin.user.id,
      action: "admin.user.quota.update",
      targetType: "user",
      targetId: userId,
      beforeJson: JSON.stringify(toUserPublicView(userBefore)),
      afterJson: JSON.stringify(toUserPublicView(userAfter)),
      metadataJson: JSON.stringify({
        freeLimitUsd: typeof freeLimitUsdRaw === "number" ? roundUsd(freeLimitUsdRaw) : null,
        paidBalanceDeltaUsd: typeof paidBalanceDeltaUsdRaw === "number" ? roundUsd(paidBalanceDeltaUsdRaw) : null
      })
    });
  }

  return c.json({
    ok: true,
    data: {
      changed,
      user: toUserPublicView(userAfter)
    }
  });
}

export async function adminRechargeIntentsHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  const admin = await requireAdminUser(c);
  if (!admin.ok) {
    return admin.response;
  }

  const status = optionalTrimmedString(c.req.query("status") ?? "");
  const limit = parseBoundedInt(c.req.query("limit"), 100, 1, 500);
  const cursor = decodeCursorToken(c.req.query("cursor"));

  const conditions: string[] = [];
  const binds: unknown[] = [];
  if (status && (status === "pending" || status === "confirmed" || status === "rejected")) {
    conditions.push("status = ?");
    binds.push(status);
  }
  if (cursor) {
    conditions.push("(created_at < ? OR (created_at = ? AND id < ?))");
    binds.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT id, user_id, amount_usd, status, note, created_at, updated_at,
                      confirmed_at, confirmed_by_user_id, rejected_at, rejected_by_user_id
                 FROM recharge_intents
                 ${whereClause}
                ORDER BY created_at DESC, id DESC
                LIMIT ?`;

  const rows = await c.env.NEXTCLAW_PLATFORM_DB.prepare(sql).bind(...binds, limit + 1).all<RechargeIntentRow>();
  const pagination = paginateRows(rows.results ?? [], limit);

  return c.json({
    ok: true,
    data: {
      items: pagination.items.map(toRechargeIntentView),
      nextCursor: pagination.nextCursor,
      hasMore: pagination.hasMore
    }
  });
}

export async function confirmRechargeIntentHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  const admin = await requireAdminUser(c);
  if (!admin.ok) {
    return admin.response;
  }

  const intentId = c.req.param("intentId");
  const intent = await getRechargeIntentById(c.env.NEXTCLAW_PLATFORM_DB, intentId);
  if (!intent) {
    return apiError(c, 404, "RECHARGE_INTENT_NOT_FOUND", "Recharge intent not found.");
  }
  if (intent.status !== "pending") {
    return apiError(c, 409, "RECHARGE_INTENT_NOT_PENDING", "Recharge intent is not pending.");
  }

  const now = new Date().toISOString();
  const markConfirmed = await c.env.NEXTCLAW_PLATFORM_DB.prepare(
    `UPDATE recharge_intents
        SET status = 'confirmed',
            confirmed_at = ?,
            confirmed_by_user_id = ?,
            updated_at = ?
      WHERE id = ?`
  )
    .bind(now, admin.user.id, now, intentId)
    .run();
  if (!markConfirmed.success || (markConfirmed.meta.changes ?? 0) !== 1) {
    return apiError(c, 500, "RECHARGE_INTENT_CONFIRM_FAILED", "Failed to confirm recharge intent.");
  }

  const creditUser = await c.env.NEXTCLAW_PLATFORM_DB.prepare(
    `UPDATE users
        SET paid_balance_usd = paid_balance_usd + ?,
            updated_at = ?
      WHERE id = ?`
  )
    .bind(intent.amount_usd, now, intent.user_id)
    .run();
  if (!creditUser.success || (creditUser.meta.changes ?? 0) !== 1) {
    await c.env.NEXTCLAW_PLATFORM_DB.prepare(
      `UPDATE recharge_intents
          SET status = 'pending',
              confirmed_at = NULL,
              confirmed_by_user_id = NULL,
              updated_at = ?
        WHERE id = ?`
    )
      .bind(now, intentId)
      .run();
    return apiError(c, 500, "RECHARGE_APPLY_FAILED", "Recharge intent confirmed but user balance update failed.");
  }

  try {
    await appendLedger(c.env.NEXTCLAW_PLATFORM_DB, {
      id: crypto.randomUUID(),
      userId: intent.user_id,
      kind: "recharge",
      amountUsd: roundUsd(intent.amount_usd),
      freeAmountUsd: 0,
      paidAmountUsd: roundUsd(intent.amount_usd),
      model: null,
      promptTokens: 0,
      completionTokens: 0,
      requestId: `recharge:${intent.id}`,
      note: `Recharge confirmed by ${admin.user.email}`
    });
  } catch {
    await c.env.NEXTCLAW_PLATFORM_DB.prepare(
      `UPDATE users
          SET paid_balance_usd = MAX(0, paid_balance_usd - ?),
              updated_at = ?
        WHERE id = ?`
    )
      .bind(intent.amount_usd, now, intent.user_id)
      .run();
    await c.env.NEXTCLAW_PLATFORM_DB.prepare(
      `UPDATE recharge_intents
          SET status = 'pending',
              confirmed_at = NULL,
              confirmed_by_user_id = NULL,
              updated_at = ?
        WHERE id = ?`
    )
      .bind(now, intentId)
      .run();
    return apiError(c, 500, "RECHARGE_LEDGER_FAILED", "Recharge applied but ledger write failed, rolled back.");
  }

  await appendAuditLog(c.env.NEXTCLAW_PLATFORM_DB, {
    actorUserId: admin.user.id,
    action: "admin.recharge.confirm",
    targetType: "recharge_intent",
    targetId: intent.id,
    beforeJson: JSON.stringify({ status: intent.status }),
    afterJson: JSON.stringify({ status: "confirmed", confirmedByUserId: admin.user.id, confirmedAt: now }),
    metadataJson: JSON.stringify({ amountUsd: intent.amount_usd, userId: intent.user_id })
  });

  return c.json({
    ok: true,
    data: {
      intentId: intent.id,
      status: "confirmed"
    }
  });
}

export async function rejectRechargeIntentHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  const admin = await requireAdminUser(c);
  if (!admin.ok) {
    return admin.response;
  }

  const intentId = c.req.param("intentId");
  const intent = await getRechargeIntentById(c.env.NEXTCLAW_PLATFORM_DB, intentId);
  if (!intent) {
    return apiError(c, 404, "RECHARGE_INTENT_NOT_FOUND", "Recharge intent not found.");
  }
  if (intent.status !== "pending") {
    return apiError(c, 409, "RECHARGE_INTENT_NOT_PENDING", "Recharge intent is not pending.");
  }

  const now = new Date().toISOString();
  const markRejected = await c.env.NEXTCLAW_PLATFORM_DB.prepare(
    `UPDATE recharge_intents
        SET status = 'rejected',
            rejected_at = ?,
            rejected_by_user_id = ?,
            updated_at = ?
      WHERE id = ?`
  )
    .bind(now, admin.user.id, now, intentId)
    .run();

  if (!markRejected.success || (markRejected.meta.changes ?? 0) !== 1) {
    return apiError(c, 500, "RECHARGE_INTENT_REJECT_FAILED", "Failed to reject recharge intent.");
  }

  await appendAuditLog(c.env.NEXTCLAW_PLATFORM_DB, {
    actorUserId: admin.user.id,
    action: "admin.recharge.reject",
    targetType: "recharge_intent",
    targetId: intent.id,
    beforeJson: JSON.stringify({ status: intent.status }),
    afterJson: JSON.stringify({ status: "rejected", rejectedByUserId: admin.user.id, rejectedAt: now }),
    metadataJson: JSON.stringify({ amountUsd: intent.amount_usd, userId: intent.user_id })
  });

  return c.json({
    ok: true,
    data: {
      intentId: intent.id,
      status: "rejected"
    }
  });
}

export async function patchAdminSettingsHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  await ensurePlatformBootstrap(c.env);
  const admin = await requireAdminUser(c);
  if (!admin.ok) {
    return admin.response;
  }

  const body = await readJson(c);
  const globalFreeLimitUsdRaw = readNumber(body, "globalFreeLimitUsd");
  if (!Number.isFinite(globalFreeLimitUsdRaw) || globalFreeLimitUsdRaw < 0) {
    return apiError(c, 400, "INVALID_GLOBAL_LIMIT", "globalFreeLimitUsd must be a non-negative number.");
  }

  const nextLimit = roundUsd(globalFreeLimitUsdRaw);
  const prevLimit = await readPlatformNumberSetting(c.env.NEXTCLAW_PLATFORM_DB, "global_free_limit_usd", getGlobalFreeLimit(c.env));
  await writePlatformNumberSetting(c.env.NEXTCLAW_PLATFORM_DB, "global_free_limit_usd", nextLimit);

  await appendAuditLog(c.env.NEXTCLAW_PLATFORM_DB, {
    actorUserId: admin.user.id,
    action: "admin.settings.global_free_limit.update",
    targetType: "platform_settings",
    targetId: "global_free_limit_usd",
    beforeJson: JSON.stringify({ globalFreeLimitUsd: prevLimit }),
    afterJson: JSON.stringify({ globalFreeLimitUsd: nextLimit }),
    metadataJson: null
  });

  const currentUsed = await readPlatformNumberSetting(c.env.NEXTCLAW_PLATFORM_DB, "global_free_used_usd", 0);
  return c.json({
    ok: true,
    data: {
      globalFreeLimitUsd: roundUsd(nextLimit),
      globalFreeUsedUsd: roundUsd(currentUsed),
      globalFreeRemainingUsd: roundUsd(Math.max(0, nextLimit - currentUsed))
    }
  });
}
