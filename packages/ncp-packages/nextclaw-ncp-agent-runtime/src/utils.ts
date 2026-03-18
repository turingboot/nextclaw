import type {
  NcpInvalidToolArgumentsResult,
  NcpLLMApiInput,
  NcpToolCallResult,
  OpenAIChatMessage,
} from "@nextclaw/ncp";

type ToolSchema = {
  type?: unknown;
  properties?: Record<string, ToolSchema>;
  required?: string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: ToolSchema;
};

export type ParsedToolArgs =
  | {
      ok: true;
      rawText: string;
      value: Record<string, unknown>;
    }
  | {
      ok: false;
      rawText: string;
      issues: string[];
    };

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function stringifyRawArgs(args: unknown): string {
  if (typeof args === "string") {
    return args;
  }
  if (args && typeof args === "object" && !Array.isArray(args)) {
    try {
      return JSON.stringify(args);
    } catch {
      return "[unserializable-object]";
    }
  }
  return String(args ?? "");
}

export function parseToolArgs(args: unknown): ParsedToolArgs {
  if (args && typeof args === "object" && !Array.isArray(args)) {
    return {
      ok: true,
      rawText: stringifyRawArgs(args),
      value: args as Record<string, unknown>,
    };
  }

  const rawText = stringifyRawArgs(args);
  if (typeof args !== "string") {
    return {
      ok: false,
      rawText,
      issues: ["Tool arguments must be a JSON object string."],
    };
  }

  const trimmed = args.trim();
  if (!trimmed) {
    return {
      ok: false,
      rawText,
      issues: ["Tool arguments are empty."],
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        rawText,
        issues: ["Tool arguments JSON must decode to an object."],
      };
    }
    return {
      ok: true,
      rawText,
      value: parsed as Record<string, unknown>,
    };
  } catch (error) {
    return {
      ok: false,
      rawText,
      issues: [error instanceof Error ? error.message : "Failed to parse tool arguments JSON."],
    };
  }
}

export function validateToolArgs(
  args: Record<string, unknown>,
  schema: Record<string, unknown> | undefined,
): string[] {
  if (!schema) {
    return [];
  }
  return validateToolValue(args, schema as ToolSchema, "");
}

function validateToolValue(value: unknown, schema: ToolSchema, path: string): string[] {
  const label = path || "parameter";
  const type = typeof schema.type === "string" ? schema.type : undefined;
  if (type && !matchesSchemaType(value, type)) {
    return [`${label} should be ${type}`];
  }

  const errors: string[] = [];
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${label} must be one of ${JSON.stringify(schema.enum)}`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${label} must be >= ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${label} must be <= ${schema.maximum}`);
    }
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${label} must be at least ${schema.minLength} chars`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${label} must be at most ${schema.maxLength} chars`);
    }
  }
  if (type === "object") {
    const objectValue = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in objectValue)) {
        errors.push(`missing required ${path ? `${path}.${key}` : key}`);
      }
    }
    const properties = schema.properties ?? {};
    for (const [key, childValue] of Object.entries(objectValue)) {
      const childSchema = properties[key];
      if (!childSchema) {
        continue;
      }
      errors.push(...validateToolValue(childValue, childSchema, path ? `${path}.${key}` : key));
    }
  }
  if (type === "array" && schema.items && Array.isArray(value)) {
    value.forEach((item, index) => {
      errors.push(...validateToolValue(item, schema.items as ToolSchema, `${label}[${index}]`));
    });
  }
  return errors;
}

function matchesSchemaType(value: unknown, type: string): boolean {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}

export function createInvalidToolArgumentsResult(params: {
  toolCallId: string;
  toolName: string;
  rawArgumentsText: string;
  issues: string[];
}): NcpInvalidToolArgumentsResult {
  return {
    ok: false,
    error: {
      code: "invalid_tool_arguments",
      message: "Tool arguments are invalid.",
      toolCallId: params.toolCallId,
      toolName: params.toolName,
      rawArgumentsText: params.rawArgumentsText,
      issues: params.issues,
    },
  };
}

export function appendToolRoundToInput(
  input: NcpLLMApiInput,
  reasoning: string,
  text: string,
  toolResults: ReadonlyArray<NcpToolCallResult>,
): NcpLLMApiInput {
  const assistantMsg: OpenAIChatMessage = {
    role: "assistant",
    content: text || null,
    ...(reasoning ? { reasoning_content: reasoning } : {}),
    tool_calls: toolResults.map((tr) => ({
      id: tr.toolCallId,
      type: "function" as const,
      function: {
        name: tr.toolName,
        arguments: tr.rawArgsText,
      },
    })),
  };
  const toolMsgs: OpenAIChatMessage[] = toolResults.map((tr) => ({
    role: "tool" as const,
    content:
      typeof tr.result === "string" ? tr.result : JSON.stringify(tr.result ?? {}),
    tool_call_id: tr.toolCallId,
  }));
  return {
    ...input,
    messages: [...input.messages, assistantMsg, ...toolMsgs],
  };
}
