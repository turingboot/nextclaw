import { describe, expect, it, vi } from "vitest";
import { LarkClient } from "./lark-client.js";

describe("lark client message resource download", () => {
  it("downloads message resources through the SDK", async () => {
    const getMock = vi.fn().mockResolvedValue(Buffer.from("image-bytes"));
    const client = LarkClient.fromCredentials({
      accountId: "test",
      appId: "app-id",
      appSecret: "app-secret"
    });

    ((client as unknown) as { sdkClient: unknown }).sdkClient = {
      im: {
        messageResource: {
          get: getMock
        }
      }
    };

    const result = await client.downloadMessageResource({
      messageId: "om_message_123",
      fileKey: "img_v3_123",
      type: "image"
    });

    expect(result.buffer).toEqual(Buffer.from("image-bytes"));
    expect(getMock).toHaveBeenCalledWith({
      path: { message_id: "om_message_123", file_key: "img_v3_123" },
      params: { type: "image" }
    });
  });

  it("rejects invalid file keys before calling the SDK", async () => {
    const getMock = vi.fn();
    const client = LarkClient.fromCredentials({
      accountId: "test",
      appId: "app-id",
      appSecret: "app-secret"
    });

    ((client as unknown) as { sdkClient: unknown }).sdkClient = {
      im: {
        messageResource: {
          get: getMock
        }
      }
    };

    await expect(
      client.downloadMessageResource({
        messageId: "om_message_123",
        fileKey: "../bad-key",
        type: "file"
      })
    ).rejects.toThrow("invalid file_key");
    expect(getMock).not.toHaveBeenCalled();
  });
});
