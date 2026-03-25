import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { FeishuChannel } from "./feishu.js";

test("FeishuChannel downloads inbound image resources to local media files", async () => {
  const homeDir = mkdtempSync(join(tmpdir(), "nextclaw-feishu-runtime-test-"));
  process.env.NEXTCLAW_HOME = homeDir;

  const published: Array<Record<string, unknown>> = [];
  const channel = new FeishuChannel(
    {
      enabled: true,
      name: "",
      appId: "app-id",
      appSecret: "app-secret",
      encryptKey: "",
      verificationToken: "",
      domain: "feishu",
      allowFrom: [],
      dmPolicy: "open",
      groupPolicy: "open",
      groupAllowFrom: [],
      requireMention: false,
      mentionPatterns: [],
      groups: {},
      textChunkLimit: 4000,
      mediaMaxMb: 20,
      threadSession: false,
      extra: {},
      accounts: {}
    },
    {
      publishInbound: async (message: Record<string, unknown>) => {
        published.push(message as unknown as Record<string, unknown>);
      }
    } as never
  );

  ((channel as unknown) as { clients: Map<string, unknown> }).clients.set("default", {
    accountId: "default",
    client: {
      addReaction: async () => undefined,
      downloadMessageResource: async () => ({ buffer: Buffer.from("fake-image") })
    },
    botOpenId: "ou_bot"
  });

  await ((channel as unknown) as {
    handleIncoming: (accountId: string, data: Record<string, unknown>) => Promise<void>;
  }).handleIncoming(
    "default",
    {
      sender: {
        sender_id: {
          open_id: "ou_user"
        },
        sender_type: "user"
      },
      message: {
        message_id: "om_test_message",
        chat_id: "oc_test_chat",
        chat_type: "p2p",
        message_type: "image",
        content: JSON.stringify({ image_key: "img_v3_123" })
      }
    }
  );

  const inbound = published[0] as {
    content: string;
    attachments: Array<{ path?: string; status?: string }>;
  };
  assert.ok(inbound);
  assert.equal(inbound.content, "[image]");
  assert.equal(inbound.attachments.length, 1);
  assert.equal(inbound.attachments[0]?.status, "ready");
  assert.ok(inbound.attachments[0]?.path);
  assert.equal(readFileSync(inbound.attachments[0]!.path!, "utf8"), "fake-image");

  rmSync(homeDir, { recursive: true, force: true });
  delete process.env.NEXTCLAW_HOME;
});

test("FeishuChannel keeps failed downloads explicit instead of leaking img keys as URLs", async () => {
  const channel = new FeishuChannel(
    {
      enabled: true,
      name: "",
      appId: "app-id",
      appSecret: "app-secret",
      encryptKey: "",
      verificationToken: "",
      domain: "feishu",
      allowFrom: [],
      dmPolicy: "open",
      groupPolicy: "open",
      groupAllowFrom: [],
      requireMention: false,
      mentionPatterns: [],
      groups: {},
      textChunkLimit: 4000,
      mediaMaxMb: 20,
      threadSession: false,
      extra: {},
      accounts: {}
    },
    {
      publishInbound: async () => undefined
    } as never
  );

  const payload = await (
    (channel as unknown) as {
      buildInboundPayload: (
        account: Record<string, unknown>,
        messageInfo: { rawContent: string; msgType: string; messageId?: string },
        mentions: unknown[]
      ) => Promise<{ content: string; attachments: Array<Record<string, unknown>> }>;
    }
  ).buildInboundPayload(
    {
      accountId: "default",
      client: {
        downloadMessageResource: async () => {
          throw new Error("boom");
        }
      }
    },
    {
      rawContent: JSON.stringify({ image_key: "img_v3_456" }),
      msgType: "image",
      messageId: "om_test_message"
    },
    []
  );

  assert.equal(payload.content, "[image]");
  assert.deepEqual(payload.attachments[0], {
    id: "img_v3_456",
    name: undefined,
    source: "feishu",
    status: "remote-only",
    mimeType: "image/*",
    errorCode: "download_failed"
  });
});
