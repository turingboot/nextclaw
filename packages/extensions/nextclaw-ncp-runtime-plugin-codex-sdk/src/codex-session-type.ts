import type { Config } from "@nextclaw/core";

export type SessionTypeDescriptor = {
  ready?: boolean;
  reason?: string | null;
  reasonMessage?: string | null;
  supportedModels?: string[];
  recommendedModel?: string | null;
  cta?: {
    kind: string;
    label?: string;
    href?: string;
  } | null;
};

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const values = value
    .map((entry) => readString(entry))
    .filter((entry): entry is string => Boolean(entry));
  return values.length > 0 ? values : undefined;
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function resolveConfiguredCodexModels(params: {
  config: Config;
  pluginConfig: Record<string, unknown>;
}): string[] {
  const explicitSupportedModels = readStringArray(params.pluginConfig.supportedModels);
  if (explicitSupportedModels) {
    return dedupeStrings(explicitSupportedModels);
  }

  const configuredProviders =
    params.config.providers && typeof params.config.providers === "object" && !Array.isArray(params.config.providers)
      ? (params.config.providers as Record<string, { models?: string[] | null }>)
      : {};
  const configuredModels = Object.entries(configuredProviders).flatMap(([providerName, provider]) =>
    (provider.models ?? [])
      .map((modelName) => readString(modelName))
      .filter((modelName): modelName is string => Boolean(modelName))
      .map((modelName) => `${providerName}/${modelName}`),
  );

  const fallbackModel = readString(params.pluginConfig.model) ?? params.config.agents.defaults.model;
  const fallbackModels = fallbackModel ? [fallbackModel] : [];
  return dedupeStrings(configuredModels.length > 0 ? configuredModels : fallbackModels);
}

function resolveRecommendedCodexModel(params: {
  config: Config;
  pluginConfig: Record<string, unknown>;
  supportedModels: string[];
}): string | null {
  const configuredModel = readString(params.pluginConfig.model) ?? params.config.agents.defaults.model;
  if (params.supportedModels.includes(configuredModel)) {
    return configuredModel;
  }
  return params.supportedModels[0] ?? configuredModel ?? null;
}

export function createDescribeCodexSessionType(params: {
  config: Config;
  pluginConfig: Record<string, unknown>;
}): () => SessionTypeDescriptor {
  return () => {
    const supportedModels = resolveConfiguredCodexModels(params);
    return {
      ready: true,
      reason: null,
      reasonMessage: null,
      supportedModels,
      recommendedModel: resolveRecommendedCodexModel({
        config: params.config,
        pluginConfig: params.pluginConfig,
        supportedModels,
      }),
      cta: null,
    };
  };
}
