import { DomainValidationError } from "../domain/errors";
import type {
  LocalizedTextMap,
  MarketplaceCatalogSection,
  MarketplaceCatalogSnapshot,
  MarketplaceItem,
  MarketplaceItemType,
  MarketplacePluginInstallSpec,
  MarketplaceRecommendationScene,
  MarketplaceSkillInstallSpec
} from "../domain/model";
import { BaseMarketplaceDataSource } from "./data-source";

type ItemRow = {
  id: string;
  slug: string;
  type: MarketplaceItemType;
  name: string;
  summary: string;
  summary_i18n: string;
  description: string | null;
  description_i18n: string | null;
  tags: string;
  author: string;
  source_repo: string | null;
  homepage: string | null;
  install_kind: string;
  install_spec: string;
  install_command: string;
  published_at: string;
  updated_at: string;
};

type SceneRow = {
  scene_id: string;
  scene_type: MarketplaceItemType;
  title: string;
  description: string | null;
  item_id: string | null;
};

type SkillFileRow = {
  file_path: string;
  content_b64: string;
  content_sha256: string;
  updated_at: string;
};

type ExistingItemRow = {
  id: string;
  type: MarketplaceItemType;
  published_at: string;
};

export type MarketplaceSkillFile = {
  path: string;
  contentBase64: string;
  sha256: string;
  updatedAt: string;
};

export type MarketplaceSkillUpsertInput = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  summaryI18n?: LocalizedTextMap;
  description?: string;
  descriptionI18n?: LocalizedTextMap;
  tags?: string[];
  author: string;
  sourceRepo?: string;
  homepage?: string;
  files: Array<{
    path: string;
    contentBase64: string;
  }>;
  publishedAt?: string;
  updatedAt?: string;
};

export class D1MarketplaceDataSource extends BaseMarketplaceDataSource {
  constructor(private readonly db: D1Database) {
    super();
  }

  async loadSnapshot(): Promise<MarketplaceCatalogSnapshot> {
    const itemsResult = await this.db
      .prepare(`
        SELECT
          id,
          slug,
          type,
          name,
          summary,
          summary_i18n,
          description,
          description_i18n,
          tags,
          author,
          source_repo,
          homepage,
          install_kind,
          install_spec,
          install_command,
          published_at,
          updated_at
        FROM marketplace_items
      `)
      .all<ItemRow>();

    const sceneResult = await this.db
      .prepare(`
        SELECT
          s.id AS scene_id,
          s.type AS scene_type,
          s.title,
          s.description,
          i.item_id
        FROM marketplace_recommendation_scenes s
        LEFT JOIN marketplace_recommendation_items i ON i.scene_id = s.id
        ORDER BY s.type ASC, s.id ASC, i.sort_order ASC
      `)
      .all<SceneRow>();

    const items = (itemsResult.results ?? []).map((row) => this.mapItemRow(row));
    const scenes = this.mapScenes(sceneResult.results ?? [], items);

    const pluginSection = this.buildSection("plugin", items, scenes);
    const skillSection = this.buildSection("skill", items, scenes);

    const generatedAt = this.pickSnapshotGeneratedAt(items);
    const version = generatedAt;

    return {
      version,
      generatedAt,
      plugins: pluginSection,
      skills: skillSection
    };
  }

  async getSkillFilesBySlug(slug: string): Promise<{ item: MarketplaceItem; files: MarketplaceSkillFile[] } | null> {
    const item = await this.getSkillItemBySlug(slug);
    if (!item) {
      return null;
    }

    const filesResult = await this.db
      .prepare(`
        SELECT file_path, content_b64, content_sha256, updated_at
        FROM marketplace_skill_files
        WHERE skill_item_id = ?
        ORDER BY file_path ASC
      `)
      .bind(item.id)
      .all<SkillFileRow>();

    return {
      item,
      files: (filesResult.results ?? []).map((row) => ({
        path: row.file_path,
        contentBase64: row.content_b64,
        sha256: row.content_sha256,
        updatedAt: row.updated_at
      }))
    };
  }

  async upsertSkill(rawInput: unknown): Promise<{ created: boolean; item: MarketplaceItem; fileCount: number }> {
    const input = this.parseUpsertInput(rawInput);
    const nowIso = new Date().toISOString();

    const existing = await this.db
      .prepare("SELECT id, type, published_at FROM marketplace_items WHERE slug = ?")
      .bind(input.slug)
      .first<ExistingItemRow>();

    if (existing && existing.type !== "skill") {
      throw new DomainValidationError(`slug already exists for non-skill item: ${input.slug}`);
    }

    const itemId = existing?.id ?? input.id ?? `skill-${input.slug}`;
    const publishedAt = input.publishedAt ?? existing?.published_at ?? nowIso;
    const updatedAt = input.updatedAt ?? nowIso;
    const install: MarketplaceSkillInstallSpec = {
      kind: "marketplace",
      spec: input.slug,
      command: `nextclaw skills install ${input.slug}`
    };

    await this.db
      .prepare(`
        INSERT INTO marketplace_items (
          id, slug, type, name, summary, summary_i18n, description, description_i18n,
          tags, author, source_repo, homepage, install_kind, install_spec, install_command,
          published_at, updated_at
        ) VALUES (?, ?, 'skill', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          name = excluded.name,
          summary = excluded.summary,
          summary_i18n = excluded.summary_i18n,
          description = excluded.description,
          description_i18n = excluded.description_i18n,
          tags = excluded.tags,
          author = excluded.author,
          source_repo = excluded.source_repo,
          homepage = excluded.homepage,
          install_kind = excluded.install_kind,
          install_spec = excluded.install_spec,
          install_command = excluded.install_command,
          updated_at = excluded.updated_at
      `)
      .bind(
        itemId,
        input.slug,
        input.name,
        input.summary,
        JSON.stringify(input.summaryI18n),
        input.description ?? null,
        input.descriptionI18n ? JSON.stringify(input.descriptionI18n) : null,
        JSON.stringify(input.tags),
        input.author,
        input.sourceRepo ?? null,
        input.homepage ?? null,
        install.kind,
        install.spec,
        install.command,
        publishedAt,
        updatedAt
      )
      .run();

    await this.db.prepare("DELETE FROM marketplace_skill_files WHERE skill_item_id = ?").bind(itemId).run();

    for (const file of input.files) {
      const bytes = this.decodeBase64(file.contentBase64, `files.${file.path}`);
      const sha256 = await this.sha256Hex(bytes);
      await this.db
        .prepare(`
          INSERT INTO marketplace_skill_files (
            skill_item_id,
            file_path,
            content_b64,
            content_sha256,
            updated_at
          ) VALUES (?, ?, ?, ?, ?)
        `)
        .bind(itemId, file.path, file.contentBase64, sha256, updatedAt)
        .run();
    }

    await this.ensureDefaultSkillRecommendation(itemId);

    const item = await this.getSkillItemBySlug(input.slug);
    if (!item) {
      throw new DomainValidationError(`upsert succeeded but item not found: ${input.slug}`);
    }

    return {
      created: !existing,
      item,
      fileCount: input.files.length
    };
  }

  private async ensureDefaultSkillRecommendation(itemId: string): Promise<void> {
    const sceneId = "skills-default";
    await this.db
      .prepare(`
        INSERT OR IGNORE INTO marketplace_recommendation_scenes (id, type, title, description)
        VALUES (?, 'skill', ?, ?)
      `)
      .bind(sceneId, "Recommended Skills", "Curated skill list")
      .run();

    const maxSortRow = await this.db
      .prepare("SELECT MAX(sort_order) AS max_sort FROM marketplace_recommendation_items WHERE scene_id = ?")
      .bind(sceneId)
      .first<{ max_sort: number | null }>();

    const nextSort = Number.isFinite(maxSortRow?.max_sort) ? Number(maxSortRow?.max_sort) + 1 : 0;

    await this.db
      .prepare(`
        INSERT OR IGNORE INTO marketplace_recommendation_items (scene_id, item_id, sort_order)
        VALUES (?, ?, ?)
      `)
      .bind(sceneId, itemId, nextSort)
      .run();
  }

  private async getSkillItemBySlug(slug: string): Promise<MarketplaceItem | null> {
    const row = await this.db
      .prepare(`
        SELECT
          id,
          slug,
          type,
          name,
          summary,
          summary_i18n,
          description,
          description_i18n,
          tags,
          author,
          source_repo,
          homepage,
          install_kind,
          install_spec,
          install_command,
          published_at,
          updated_at
        FROM marketplace_items
        WHERE type = 'skill' AND slug = ?
        LIMIT 1
      `)
      .bind(slug)
      .first<ItemRow>();

    if (!row) {
      return null;
    }

    return this.mapItemRow(row);
  }

  private parseUpsertInput(rawInput: unknown): MarketplaceSkillUpsertInput {
    if (!this.isRecord(rawInput)) {
      throw new DomainValidationError("body must be an object");
    }

    const slug = this.readSlug(rawInput.slug, "body.slug");
    const id = this.readOptionalString(rawInput.id, "body.id");
    const name = this.readString(rawInput.name, "body.name");
    const summary = this.readString(rawInput.summary, "body.summary");
    const description = this.readOptionalString(rawInput.description, "body.description");
    const author = this.readString(rawInput.author, "body.author");
    const sourceRepo = this.readOptionalString(rawInput.sourceRepo, "body.sourceRepo");
    const homepage = this.readOptionalString(rawInput.homepage, "body.homepage");

    const summaryI18n = this.readLocalizedTextMap(rawInput.summaryI18n, "body.summaryI18n", summary);
    const descriptionI18n = description
      ? this.readLocalizedTextMap(rawInput.descriptionI18n, "body.descriptionI18n", description)
      : undefined;

    const tags = this.readStringArray(rawInput.tags, "body.tags");
    const publishedAt = this.readOptionalDateTime(rawInput.publishedAt, "body.publishedAt");
    const updatedAt = this.readOptionalDateTime(rawInput.updatedAt, "body.updatedAt");
    const files = this.readSkillFiles(rawInput.files, "body.files");

    if (!files.some((file) => file.path === "SKILL.md")) {
      throw new DomainValidationError("body.files must include SKILL.md");
    }

    return {
      id,
      slug,
      name,
      summary,
      summaryI18n,
      description,
      descriptionI18n,
      tags,
      author,
      sourceRepo,
      homepage,
      files,
      publishedAt,
      updatedAt
    };
  }

  private readSkillFiles(value: unknown, path: string): Array<{ path: string; contentBase64: string }> {
    if (!Array.isArray(value) || value.length === 0) {
      throw new DomainValidationError(`${path} must be a non-empty array`);
    }

    const normalized = value.map((entry, index) => {
      if (!this.isRecord(entry)) {
        throw new DomainValidationError(`${path}[${index}] must be an object`);
      }
      const filePath = this.normalizeFilePath(this.readString(entry.path, `${path}[${index}].path`), `${path}[${index}].path`);
      const contentBase64 = this.readString(entry.contentBase64, `${path}[${index}].contentBase64`);
      this.decodeBase64(contentBase64, `${path}[${index}].contentBase64`);
      return {
        path: filePath,
        contentBase64
      };
    });

    const deduped = new Map<string, { path: string; contentBase64: string }>();
    for (const file of normalized) {
      deduped.set(file.path, file);
    }
    return [...deduped.values()];
  }

  private normalizeFilePath(raw: string, path: string): string {
    const normalized = raw.replace(/\\/g, "/").trim();
    if (!normalized || normalized.startsWith("/")) {
      throw new DomainValidationError(`${path} must be a relative path`);
    }
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length === 0) {
      throw new DomainValidationError(`${path} must be a relative path`);
    }
    for (const segment of segments) {
      if (segment === "." || segment === "..") {
        throw new DomainValidationError(`${path} must not contain traversal segments`);
      }
    }
    return segments.join("/");
  }

  private mapItemRow(row: ItemRow): MarketplaceItem {
    const summaryI18n = this.parseLocalizedMap(row.summary_i18n, `marketplace_items.summary_i18n(${row.slug})`, row.summary);
    const description = row.description ?? undefined;
    const descriptionI18n = description
      ? this.parseLocalizedMap(row.description_i18n, `marketplace_items.description_i18n(${row.slug})`, description)
      : undefined;

    const base = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      summary: row.summary,
      summaryI18n,
      description,
      descriptionI18n,
      tags: this.parseStringArray(row.tags, `marketplace_items.tags(${row.slug})`),
      author: row.author,
      sourceRepo: row.source_repo ?? undefined,
      homepage: row.homepage ?? undefined,
      publishedAt: row.published_at,
      updatedAt: row.updated_at
    };

    if (row.type === "plugin") {
      return {
        ...base,
        type: "plugin",
        install: this.mapInstall("plugin", row.install_kind, row.install_spec, row.install_command, row.slug)
      };
    }

    return {
      ...base,
      type: "skill",
      install: this.mapInstall("skill", row.install_kind, row.install_spec, row.install_command, row.slug)
    };
  }

  private mapInstall(
    type: "plugin",
    kind: string,
    spec: string,
    command: string,
    slug: string
  ): MarketplacePluginInstallSpec;
  private mapInstall(
    type: "skill",
    kind: string,
    spec: string,
    command: string,
    slug: string
  ): MarketplaceSkillInstallSpec;
  private mapInstall(
    type: MarketplaceItemType,
    kind: string,
    spec: string,
    command: string,
    slug: string
  ): MarketplacePluginInstallSpec | MarketplaceSkillInstallSpec {
    if (type === "plugin") {
      if (kind !== "npm") {
        throw new DomainValidationError(`plugin install.kind must be npm: ${slug}`);
      }
      return {
        kind: "npm",
        spec,
        command
      };
    }

    if (kind !== "builtin" && kind !== "marketplace") {
      throw new DomainValidationError(`skill install.kind must be builtin|marketplace: ${slug}`);
    }

    return {
      kind,
      spec,
      command
    };
  }

  private mapScenes(rows: SceneRow[], items: MarketplaceItem[]): Map<MarketplaceItemType, MarketplaceRecommendationScene[]> {
    const itemTypeById = new Map(items.map((item) => [item.id, item.type] as const));
    const sceneMap = new Map<string, { type: MarketplaceItemType; scene: MarketplaceRecommendationScene }>();

    for (const row of rows) {
      const key = `${row.scene_type}:${row.scene_id}`;
      let existing = sceneMap.get(key);
      if (!existing) {
        existing = {
          type: row.scene_type,
          scene: {
            id: row.scene_id,
            title: row.title,
            description: row.description ?? undefined,
            itemIds: []
          }
        };
        sceneMap.set(key, existing);
      }

      if (row.item_id) {
        const itemType = itemTypeById.get(row.item_id);
        if (itemType === row.scene_type) {
          existing.scene.itemIds.push(row.item_id);
        }
      }
    }

    const byType = new Map<MarketplaceItemType, MarketplaceRecommendationScene[]>([
      ["plugin", []],
      ["skill", []]
    ]);

    for (const value of sceneMap.values()) {
      const list = byType.get(value.type);
      if (list) {
        list.push(value.scene);
      }
    }

    return byType;
  }

  private buildSection(
    type: MarketplaceItemType,
    items: MarketplaceItem[],
    scenes: Map<MarketplaceItemType, MarketplaceRecommendationScene[]>
  ): MarketplaceCatalogSection {
    return {
      items: items.filter((item) => item.type === type),
      recommendations: scenes.get(type) ?? []
    };
  }

  private pickSnapshotGeneratedAt(items: MarketplaceItem[]): string {
    const first = items[0];
    if (!first) {
      return new Date(0).toISOString();
    }

    let latest = first.updatedAt;
    let latestTs = Date.parse(latest);
    for (const item of items.slice(1)) {
      const ts = Date.parse(item.updatedAt);
      if (!Number.isNaN(ts) && (Number.isNaN(latestTs) || ts > latestTs)) {
        latestTs = ts;
        latest = item.updatedAt;
      }
    }
    return latest;
  }

  private parseStringArray(raw: string, path: string): string[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new DomainValidationError(`${path} must be valid JSON array`);
    }

    if (!Array.isArray(parsed)) {
      throw new DomainValidationError(`${path} must be an array`);
    }

    return parsed.map((entry, index) => this.readString(entry, `${path}[${index}]`));
  }

  private parseLocalizedMap(raw: string | null, path: string, fallbackEn: string): LocalizedTextMap {
    if (!raw) {
      return {
        en: fallbackEn,
        zh: fallbackEn
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new DomainValidationError(`${path} must be valid JSON object`);
    }

    return this.readLocalizedTextMap(parsed, path, fallbackEn);
  }

  private readLocalizedTextMap(value: unknown, path: string, fallbackEn: string): LocalizedTextMap {
    const localized: LocalizedTextMap = {};

    if (this.isRecord(value)) {
      for (const [locale, text] of Object.entries(value)) {
        localized[locale] = this.readString(text, `${path}.${locale}`);
      }
    }

    if (!localized.en) {
      localized.en = this.pickLocaleFamilyValue(localized, "en") ?? fallbackEn;
    }
    if (!localized.zh) {
      localized.zh = this.pickLocaleFamilyValue(localized, "zh") ?? localized.en;
    }

    return localized;
  }

  private pickLocaleFamilyValue(localized: LocalizedTextMap, localeFamily: string): string | undefined {
    const normalizedFamily = this.normalizeLocaleTag(localeFamily).split("-")[0];
    if (!normalizedFamily) {
      return undefined;
    }

    let familyMatch: string | undefined;
    for (const [locale, text] of Object.entries(localized)) {
      const normalizedLocale = this.normalizeLocaleTag(locale);
      if (!normalizedLocale) {
        continue;
      }
      if (normalizedLocale === normalizedFamily) {
        return text;
      }
      if (!familyMatch && normalizedLocale.startsWith(`${normalizedFamily}-`)) {
        familyMatch = text;
      }
    }

    return familyMatch;
  }

  private normalizeLocaleTag(value: string): string {
    return value.trim().toLowerCase().replace(/_/g, "-");
  }

  private readSlug(value: unknown, path: string): string {
    const slug = this.readString(value, path);
    if (!/^[A-Za-z0-9._-]+$/.test(slug)) {
      throw new DomainValidationError(`${path} must match /^[A-Za-z0-9._-]+$/`);
    }
    return slug;
  }

  private readString(value: unknown, path: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new DomainValidationError(`${path} must be a non-empty string`);
    }
    return value.trim();
  }

  private readOptionalString(value: unknown, path: string): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    return this.readString(value, path);
  }

  private readOptionalDateTime(value: unknown, path: string): string | undefined {
    const text = this.readOptionalString(value, path);
    if (!text) {
      return undefined;
    }
    if (Number.isNaN(Date.parse(text))) {
      throw new DomainValidationError(`${path} must be a valid datetime string`);
    }
    return text;
  }

  private readStringArray(value: unknown, path: string): string[] {
    if (value === undefined || value === null) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new DomainValidationError(`${path} must be an array`);
    }
    return value.map((entry, index) => this.readString(entry, `${path}[${index}]`));
  }

  private decodeBase64(raw: string, path: string): Uint8Array {
    let binary: string;
    try {
      binary = atob(raw);
    } catch {
      throw new DomainValidationError(`${path} must be valid base64`);
    }

    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  private async sha256Hex(bytes: Uint8Array): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const digestBytes = new Uint8Array(digest);
    return [...digestBytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
