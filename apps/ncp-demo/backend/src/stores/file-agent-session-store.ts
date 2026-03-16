import { join } from "node:path";
import type { AgentSessionRecord, AgentSessionStore } from "@nextclaw/ncp-toolkit";
import {
  deleteFileIfExists,
  encodeStorageKey,
  listFiles,
  readJsonFile,
  writeJsonAtomic,
} from "./file-store-utils.js";

export type FileAgentSessionStoreOptions = {
  baseDir: string;
};

export class FileAgentSessionStore implements AgentSessionStore {
  private readonly sessionsDir: string;

  constructor(options: FileAgentSessionStoreOptions) {
    this.sessionsDir = join(assertBaseDir(options.baseDir), "sessions");
  }

  async getSession(sessionId: string): Promise<AgentSessionRecord | null> {
    const session = await readJsonFile<AgentSessionRecord>(this.getSessionPath(sessionId));
    return session ? structuredClone(session) : null;
  }

  async listSessions(): Promise<AgentSessionRecord[]> {
    const fileNames = await listFiles(this.sessionsDir, ".json");
    const sessions = await Promise.all(
      fileNames.map((fileName) => readJsonFile<AgentSessionRecord>(join(this.sessionsDir, fileName))),
    );

    return sessions
      .filter((session): session is AgentSessionRecord => session !== null)
      .map((session) => structuredClone(session));
  }

  async saveSession(session: AgentSessionRecord): Promise<void> {
    await writeJsonAtomic(this.getSessionPath(session.sessionId), session);
  }

  async deleteSession(sessionId: string): Promise<AgentSessionRecord | null> {
    const filePath = this.getSessionPath(sessionId);
    const existing = await readJsonFile<AgentSessionRecord>(filePath);
    if (!existing) {
      return null;
    }

    await deleteFileIfExists(filePath);
    return structuredClone(existing);
  }

  private getSessionPath(sessionId: string): string {
    return join(this.sessionsDir, `${encodeStorageKey(sessionId)}.json`);
  }
}

function assertBaseDir(baseDir: string): string {
  const value = baseDir.trim();
  if (!value) {
    throw new Error("FileAgentSessionStore requires a non-empty baseDir.");
  }
  return value;
}
