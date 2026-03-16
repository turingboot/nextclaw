import { join } from "node:path";
import type {
  NcpEndpointEvent,
  NcpMessageAbortPayload,
  NcpRequestEnvelope,
  NcpStreamRequestPayload,
} from "@nextclaw/ncp";
import type { NcpEventType } from "@nextclaw/ncp";
import type { AgentRunStore, RunRecord } from "@nextclaw/ncp-toolkit";
import {
  appendJsonLines,
  deleteFileIfExists,
  encodeStorageKey,
  listFiles,
  readJsonFile,
  readJsonLinesFile,
  writeJsonAtomic,
  writeTextFile,
} from "./file-store-utils.js";

export type FileAgentRunStoreOptions = {
  baseDir: string;
};

type StoredRunRecord = Omit<RunRecord, "events">;

export class FileAgentRunStore implements AgentRunStore {
  private readonly runRecordsDir: string;
  private readonly runEventsDir: string;
  private readonly writeQueue = new Map<string, Promise<void>>();

  constructor(options: FileAgentRunStoreOptions) {
    const baseDir = assertBaseDir(options.baseDir);
    this.runRecordsDir = join(baseDir, "runs", "records");
    this.runEventsDir = join(baseDir, "runs", "events");
  }

  async createRunRecord(
    event: Extract<NcpEndpointEvent, { type: typeof NcpEventType.RunStarted }>,
    envelope: NcpRequestEnvelope,
  ): Promise<RunRecord> {
    const runId = event.payload.runId?.trim() || `${envelope.sessionId}-${Date.now()}`;
    const record: StoredRunRecord = {
      runId,
      sessionId: envelope.sessionId,
      correlationId: envelope.correlationId,
      requestMessageId: envelope.message.id,
      responseMessageId: event.payload.messageId,
    };

    await this.enqueueWrite(runId, async () => {
      await writeJsonAtomic(this.getRunRecordPath(runId), record);
      await writeTextFile(this.getRunEventsPath(runId), "");
    });

    return {
      ...structuredClone(record),
      events: [],
    };
  }

  async getRunRecord(runId: string): Promise<RunRecord | null> {
    await this.waitForWrite(runId);
    const record = await this.readStoredRunRecord(runId);
    if (!record) {
      return null;
    }

    const events = await this.readRunEvents(runId);
    return {
      ...structuredClone(record),
      events,
    };
  }

  async resolveRunRecord(payload: NcpMessageAbortPayload): Promise<RunRecord | null> {
    if (payload.runId) {
      return this.getRunRecord(payload.runId);
    }

    const records = await this.listStoredRunRecords();
    for (const record of records) {
      if (payload.correlationId && record.correlationId === payload.correlationId) {
        return this.getRunRecord(record.runId);
      }

      if (!payload.messageId) {
        continue;
      }

      const matchesRequest = record.requestMessageId === payload.messageId;
      const matchesResponse = record.responseMessageId === payload.messageId;
      if (matchesRequest || matchesResponse) {
        return this.getRunRecord(record.runId);
      }
    }

    return null;
  }

  async appendEvents(runId: string, events: NcpEndpointEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.enqueueWrite(runId, async () => {
      const record = await this.readStoredRunRecord(runId);
      if (!record) {
        return;
      }

      await appendJsonLines(this.getRunEventsPath(runId), events.map((event) => structuredClone(event)));
    });
  }

  async *streamEvents(
    payload: NcpStreamRequestPayload,
    signal: AbortSignal,
  ): AsyncIterable<NcpEndpointEvent> {
    await this.waitForWrite(payload.runId);
    const record = await this.readStoredRunRecord(payload.runId);
    if (!record || record.sessionId !== payload.sessionId) {
      return;
    }

    const fromIndex = normalizeFromEventIndex(payload.fromEventIndex);
    const events = await this.readRunEvents(payload.runId);
    for (const event of events.slice(fromIndex)) {
      if (signal.aborted) {
        break;
      }
      yield structuredClone(event);
    }
  }

  async deleteRun(runId: string): Promise<void> {
    await this.enqueueWrite(runId, async () => {
      await Promise.all([
        deleteFileIfExists(this.getRunRecordPath(runId)),
        deleteFileIfExists(this.getRunEventsPath(runId)),
      ]);
    });
  }

  async deleteSessionRuns(sessionId: string): Promise<void> {
    const records = await this.listStoredRunRecords();
    const runIds = records
      .filter((record) => record.sessionId === sessionId)
      .map((record) => record.runId);

    await Promise.all(runIds.map((runId) => this.deleteRun(runId)));
  }

  private async enqueueWrite(runId: string, task: () => Promise<void>): Promise<void> {
    const previous = this.writeQueue.get(runId) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(task);
    const settled = current.then(() => undefined, () => undefined);
    this.writeQueue.set(runId, settled);

    try {
      await current;
    } finally {
      if (this.writeQueue.get(runId) === settled) {
        this.writeQueue.delete(runId);
      }
    }
  }

  private async waitForWrite(runId: string): Promise<void> {
    await this.writeQueue.get(runId);
  }

  private async readStoredRunRecord(runId: string): Promise<StoredRunRecord | null> {
    return readJsonFile<StoredRunRecord>(this.getRunRecordPath(runId));
  }

  private async readRunEvents(runId: string): Promise<NcpEndpointEvent[]> {
    const events = await readJsonLinesFile<NcpEndpointEvent>(this.getRunEventsPath(runId));
    return events.map((event) => structuredClone(event));
  }

  private async listStoredRunRecords(): Promise<StoredRunRecord[]> {
    const fileNames = await listFiles(this.runRecordsDir, ".json");
    const records = await Promise.all(
      fileNames.map((fileName) => readJsonFile<StoredRunRecord>(join(this.runRecordsDir, fileName))),
    );
    return records.filter((record): record is StoredRunRecord => record !== null);
  }

  private getRunRecordPath(runId: string): string {
    return join(this.runRecordsDir, `${encodeStorageKey(runId)}.json`);
  }

  private getRunEventsPath(runId: string): string {
    return join(this.runEventsDir, `${encodeStorageKey(runId)}.jsonl`);
  }
}

function normalizeFromEventIndex(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function assertBaseDir(baseDir: string): string {
  const value = baseDir.trim();
  if (!value) {
    throw new Error("FileAgentRunStore requires a non-empty baseDir.");
  }
  return value;
}
