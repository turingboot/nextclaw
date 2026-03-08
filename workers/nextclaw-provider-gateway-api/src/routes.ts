import type { Hono } from "hono";
import {
  adminOverviewHandler,
  adminRechargeIntentsHandler,
  adminUsersHandler,
  confirmRechargeIntentHandler,
  patchAdminSettingsHandler,
  patchAdminUserHandler,
  rejectRechargeIntentHandler
} from "./controllers/admin-controller";
import { loginHandler, meHandler, registerHandler } from "./controllers/auth-controller";
import {
  billingLedgerHandler,
  billingOverviewHandler,
  billingRechargeIntentsHandler,
  createRechargeIntentHandler
} from "./controllers/billing-controller";
import { chatCompletionsHandler, healthHandler, modelsHandler, usageHandler } from "./controllers/openai-controller";
import type { Env } from "./types/platform";

export function registerRoutes(app: Hono<{ Bindings: Env }>): void {
  app.get("/health", healthHandler);

  app.get("/v1/models", modelsHandler);
  app.get("/v1/usage", usageHandler);
  app.post("/v1/chat/completions", chatCompletionsHandler);

  app.post("/platform/auth/register", registerHandler);
  app.post("/platform/auth/login", loginHandler);
  app.get("/platform/auth/me", meHandler);

  app.get("/platform/billing/overview", billingOverviewHandler);
  app.get("/platform/billing/ledger", billingLedgerHandler);
  app.get("/platform/billing/recharge-intents", billingRechargeIntentsHandler);
  app.post("/platform/billing/recharge-intents", createRechargeIntentHandler);

  app.get("/platform/admin/overview", adminOverviewHandler);
  app.get("/platform/admin/users", adminUsersHandler);
  app.patch("/platform/admin/users/:userId", patchAdminUserHandler);
  app.get("/platform/admin/recharge-intents", adminRechargeIntentsHandler);
  app.post("/platform/admin/recharge-intents/:intentId/confirm", confirmRechargeIntentHandler);
  app.post("/platform/admin/recharge-intents/:intentId/reject", rejectRechargeIntentHandler);
  app.patch("/platform/admin/settings", patchAdminSettingsHandler);
}
