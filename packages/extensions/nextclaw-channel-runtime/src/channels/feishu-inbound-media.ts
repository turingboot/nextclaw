import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { InboundAttachment } from "../bus/events.js";
import { inferFeishuResourceMimeType } from "./feishu-message-support.js";
import { getDataPath } from "../utils/helpers.js";

export const DEFAULT_FEISHU_MEDIA_MAX_MB = 20;

export type FeishuInboundResource = {
  type: "audio" | "file" | "image" | "sticker";
  fileKey: string;
  fileName?: string;
  duration?: number;
};

export type FeishuInboundMediaClient = {
  downloadMessageResource: (params: {
    messageId: string;
    fileKey: string;
    type: "image" | "file";
  }) => Promise<{ buffer: Buffer }>;
};

function sanitizeAttachmentName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "attachment";
}

function inferAttachmentExtension(resourceType: FeishuInboundResource["type"], mimeType?: string): string {
  const normalizedMime = mimeType?.toLowerCase();
  if (normalizedMime === "image/jpeg") {
    return ".jpg";
  }
  if (normalizedMime === "image/png") {
    return ".png";
  }
  if (normalizedMime === "image/webp") {
    return ".webp";
  }
  if (normalizedMime === "image/gif") {
    return ".gif";
  }
  if (normalizedMime === "audio/ogg") {
    return ".ogg";
  }
  if (normalizedMime === "audio/mpeg") {
    return ".mp3";
  }
  if (normalizedMime === "application/pdf") {
    return ".pdf";
  }
  if (resourceType === "image") {
    return ".jpg";
  }
  if (resourceType === "audio") {
    return ".ogg";
  }
  if (resourceType === "sticker") {
    return ".webp";
  }
  return ".bin";
}

function buildAttachmentFileName(params: {
  messageId: string;
  resource: FeishuInboundResource;
  mimeType?: string;
}): string {
  const extension = inferAttachmentExtension(params.resource.type, params.mimeType);
  const resourceId = sanitizeAttachmentName(params.resource.fileKey).slice(0, 64);
  const messageId = sanitizeAttachmentName(params.messageId).slice(0, 48);
  const preferredName = params.resource.fileName?.trim()
    ? sanitizeAttachmentName(params.resource.fileName.trim())
    : `${params.resource.type}${extension}`;
  const baseName = preferredName.includes(".") ? preferredName : `${preferredName}${extension}`;
  return `feishu_${messageId}_${resourceId}_${baseName}`;
}

function resolveMessageResourceType(resourceType: FeishuInboundResource["type"]): "image" | "file" {
  return resourceType === "image" ? "image" : "file";
}

export class FeishuInboundMediaResolver {
  private readonly maxBytes: number;

  constructor(maxMb?: number) {
    this.maxBytes = Math.max(1, maxMb ?? DEFAULT_FEISHU_MEDIA_MAX_MB) * 1024 * 1024;
  }

  async resolve(params: {
    client: FeishuInboundMediaClient;
    messageId?: string;
    resource: FeishuInboundResource;
  }): Promise<InboundAttachment> {
    const { client, messageId, resource } = params;
    const mimeType = inferFeishuResourceMimeType(resource.type);
    const baseAttachment: InboundAttachment = {
      id: resource.fileKey,
      name: resource.fileName,
      source: "feishu",
      status: "remote-only",
      mimeType
    };

    if (!messageId?.trim()) {
      return {
        ...baseAttachment,
        errorCode: "invalid_payload"
      };
    }

    try {
      const downloaded = await client.downloadMessageResource({
        messageId,
        fileKey: resource.fileKey,
        type: resolveMessageResourceType(resource.type)
      });

      if (downloaded.buffer.length > this.maxBytes) {
        return {
          ...baseAttachment,
          size: downloaded.buffer.length,
          errorCode: "too_large"
        };
      }

      const mediaDir = join(getDataPath(), "media");
      mkdirSync(mediaDir, { recursive: true });
      const fileName = buildAttachmentFileName({ messageId, resource, mimeType });
      const filePath = join(mediaDir, fileName);
      writeFileSync(filePath, downloaded.buffer);

      return {
        ...baseAttachment,
        name: fileName,
        path: filePath,
        size: downloaded.buffer.length,
        status: "ready"
      };
    } catch {
      return {
        ...baseAttachment,
        errorCode: "download_failed"
      };
    }
  }
}
