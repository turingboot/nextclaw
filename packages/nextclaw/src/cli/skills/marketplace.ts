import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { SkillsLoader } from "@nextclaw/core";

const DEFAULT_MARKETPLACE_API_BASE = "https://marketplace-api.nextclaw.io";

type MarketplaceEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type MarketplaceSkillInstallKind = "builtin" | "marketplace";

export type MarketplaceSkillInstallOptions = {
  slug: string;
  workdir: string;
  dir?: string;
  force?: boolean;
  apiBaseUrl?: string;
};

export type MarketplaceSkillPublishOptions = {
  skillDir: string;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  author?: string;
  tags?: string[];
  sourceRepo?: string;
  homepage?: string;
  publishedAt?: string;
  updatedAt?: string;
  apiBaseUrl?: string;
  token?: string;
  requireExisting?: boolean;
};

export async function installMarketplaceSkill(options: MarketplaceSkillInstallOptions): Promise<{
  slug: string;
  destinationDir: string;
  alreadyInstalled?: boolean;
  source: MarketplaceSkillInstallKind;
}> {
  const slug = validateSkillSlug(options.slug.trim(), "slug");
  const workdir = resolve(options.workdir);
  if (!existsSync(workdir)) {
    throw new Error(`Workdir does not exist: ${workdir}`);
  }

  const dirName = options.dir?.trim() || "skills";
  const destinationDir = isAbsolute(dirName) ? resolve(dirName, slug) : resolve(workdir, dirName, slug);
  const skillFile = join(destinationDir, "SKILL.md");

  if (!options.force && existsSync(destinationDir)) {
    if (existsSync(skillFile)) {
      return {
        slug,
        destinationDir,
        alreadyInstalled: true,
        source: "marketplace"
      };
    }
    throw new Error(`Skill directory already exists: ${destinationDir} (use --force)`);
  }

  const apiBase = resolveMarketplaceApiBase(options.apiBaseUrl);
  const item = await fetchMarketplaceSkillItem(apiBase, slug);

  if (item.install.kind === "builtin") {
    if (existsSync(destinationDir) && options.force) {
      rmSync(destinationDir, { recursive: true, force: true });
    }
    installBuiltinSkill(workdir, destinationDir, slug);
    return {
      slug,
      destinationDir,
      source: "builtin"
    };
  }

  const filesPayload = await fetchMarketplaceSkillFiles(apiBase, slug);

  if (existsSync(destinationDir) && options.force) {
    rmSync(destinationDir, { recursive: true, force: true });
  }
  mkdirSync(destinationDir, { recursive: true });

  for (const file of filesPayload.files) {
    const targetPath = resolve(destinationDir, ...file.path.split("/"));
    const rel = relative(destinationDir, targetPath);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      throw new Error(`Invalid marketplace file path: ${file.path}`);
    }

    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, Buffer.from(file.contentBase64, "base64"));
  }

  if (!existsSync(join(destinationDir, "SKILL.md"))) {
    throw new Error(`Marketplace skill ${slug} does not include SKILL.md`);
  }

  return {
    slug,
    destinationDir,
    source: "marketplace"
  };
}

export async function publishMarketplaceSkill(options: MarketplaceSkillPublishOptions): Promise<{
  created: boolean;
  slug: string;
  fileCount: number;
}> {
  const skillDir = resolve(options.skillDir);
  if (!existsSync(skillDir)) {
    throw new Error(`Skill directory not found: ${skillDir}`);
  }

  const files = collectFiles(skillDir);
  if (!files.some((file) => file.path === "SKILL.md")) {
    throw new Error(`Skill directory must include SKILL.md: ${skillDir}`);
  }

  const parsedFrontmatter = parseSkillFrontmatter(readFileSync(join(skillDir, "SKILL.md"), "utf8"));
  const slug = validateSkillSlug(options.slug?.trim() || basename(skillDir), "slug");
  const name = options.name?.trim() || parsedFrontmatter.name || slug;
  const description = options.description?.trim() || parsedFrontmatter.description;
  const summary = options.summary?.trim() || parsedFrontmatter.summary || description || `${slug} skill`;
  const author = options.author?.trim() || parsedFrontmatter.author || "nextclaw";
  const tags = normalizeTags(options.tags && options.tags.length > 0 ? options.tags : parsedFrontmatter.tags);

  const apiBase = resolveMarketplaceApiBase(options.apiBaseUrl);
  const token = resolveMarketplaceAdminToken(options.token);

  if (options.requireExisting) {
    await fetchMarketplaceSkillItem(apiBase, slug);
  }

  const response = await fetch(`${apiBase}/api/v1/admin/skills/upsert`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      slug,
      name,
      summary,
      description,
      author,
      tags,
      sourceRepo: options.sourceRepo?.trim() || undefined,
      homepage: options.homepage?.trim() || undefined,
      publishedAt: options.publishedAt?.trim() || undefined,
      updatedAt: options.updatedAt?.trim() || undefined,
      files
    })
  });

  const payload = await readMarketplaceEnvelope<{ created: boolean; fileCount: number }>(response);

  if (!payload.ok || !payload.data) {
    const message = payload.error?.message || `marketplace publish failed: HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    created: payload.data.created,
    slug,
    fileCount: payload.data.fileCount
  };
}

function collectFiles(rootDir: string): Array<{ path: string; contentBase64: string }> {
  const output: Array<{ path: string; contentBase64: string }> = [];

  const walk = (dir: string, prefix: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(absolute, relativePath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const content = readFileSync(absolute);
      output.push({
        path: relativePath,
        contentBase64: content.toString("base64")
      });
    }
  };

  walk(rootDir, "");
  return output;
}

function installBuiltinSkill(workdir: string, destinationDir: string, skillName: string): void {
  const loader = new SkillsLoader(workdir);
  const builtin = loader.listSkills(false).find((skill) => skill.name === skillName && skill.source === "builtin");
  if (!builtin) {
    throw new Error(`Builtin skill not found in local core bundle: ${skillName}`);
  }

  cpSync(dirname(builtin.path), destinationDir, { recursive: true, force: true });
}

async function fetchMarketplaceSkillItem(
  apiBase: string,
  slug: string
): Promise<{ install: { kind: MarketplaceSkillInstallKind } }> {
  const response = await fetch(`${apiBase}/api/v1/skills/items/${encodeURIComponent(slug)}`, {
    headers: {
      Accept: "application/json"
    }
  });
  const payload = await readMarketplaceEnvelope<{ install: { kind: MarketplaceSkillInstallKind | string } }>(response);

  if (!payload.ok || !payload.data) {
    const message = payload.error?.message || `marketplace skill fetch failed: ${response.status}`;
    throw new Error(message);
  }

  const kind = payload.data.install?.kind;
  if (kind !== "builtin" && kind !== "marketplace") {
    throw new Error(`Unsupported skill install kind from marketplace: ${String(kind)}`);
  }

  return {
    install: {
      kind
    }
  };
}

async function fetchMarketplaceSkillFiles(
  apiBase: string,
  slug: string
): Promise<{ files: Array<{ path: string; contentBase64: string }> }> {
  const response = await fetch(`${apiBase}/api/v1/skills/items/${encodeURIComponent(slug)}/files`, {
    headers: {
      Accept: "application/json"
    }
  });

  const payload = await readMarketplaceEnvelope<{ files: Array<{ path: string; contentBase64: string }> }>(response);
  if (!payload.ok || !payload.data) {
    const message = payload.error?.message || `marketplace skill file fetch failed: ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

async function readMarketplaceEnvelope<T>(response: Response): Promise<MarketplaceEnvelope<T>> {
  const raw = await response.text();
  let payload: unknown;
  try {
    payload = raw.length > 0 ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Invalid marketplace response: ${response.status}`);
  }

  if (!isRecord(payload) || typeof payload.ok !== "boolean") {
    throw new Error(`Invalid marketplace response shape: ${response.status}`);
  }

  return payload as MarketplaceEnvelope<T>;
}

function resolveMarketplaceApiBase(explicitBase: string | undefined): string {
  const raw = explicitBase?.trim()
    || process.env.NEXTCLAW_MARKETPLACE_API_BASE?.trim()
    || DEFAULT_MARKETPLACE_API_BASE;
  return raw.replace(/\/+$/, "");
}

function resolveMarketplaceAdminToken(explicitToken: string | undefined): string | undefined {
  const token = explicitToken?.trim() || process.env.NEXTCLAW_MARKETPLACE_ADMIN_TOKEN?.trim();
  return token && token.length > 0 ? token : undefined;
}

function validateSkillSlug(raw: string, fieldName: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(raw)) {
    throw new Error(`Invalid ${fieldName}: ${raw}`);
  }
  return raw;
}

function normalizeTags(rawTags: string[] | undefined): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const rawTag of rawTags ?? []) {
    const tag = rawTag.trim();
    if (!tag || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    output.push(tag);
  }
  return output.length > 0 ? output : ["skill"];
}

function parseSkillFrontmatter(raw: string): {
  name?: string;
  summary?: string;
  description?: string;
  author?: string;
  tags?: string[];
} {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match || !match[1]) {
    return {};
  }

  const metadata = new Map<string, string>();
  for (const line of match[1].split("\n")) {
    const parsed = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!parsed) {
      continue;
    }
    const key = parsed[1]?.trim().toLowerCase();
    const value = parsed[2]?.trim();
    if (!key || !value) {
      continue;
    }
    metadata.set(key, trimYamlString(value));
  }

  const rawTags = metadata.get("tags");
  let tags: string[] | undefined;
  if (rawTags) {
    if (rawTags.startsWith("[") && rawTags.endsWith("]")) {
      tags = rawTags
        .slice(1, -1)
        .split(",")
        .map((entry) => trimYamlString(entry))
        .filter(Boolean);
    } else {
      tags = rawTags.split(",").map((entry) => entry.trim()).filter(Boolean);
    }
  }

  return {
    name: metadata.get("name"),
    summary: metadata.get("summary"),
    description: metadata.get("description"),
    author: metadata.get("author"),
    tags
  };
}

function trimYamlString(raw: string): string {
  return raw.replace(/^['"]/, "").replace(/['"]$/, "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
