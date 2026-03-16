import { randomUUID } from "node:crypto";
import {
  appendFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname } from "node:path";

export function encodeStorageKey(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const text = await readTextFile(filePath);
  if (text === null) {
    return null;
  }

  return JSON.parse(text) as T;
}

export async function readJsonLinesFile<T>(filePath: string): Promise<T[]> {
  const text = await readTextFile(filePath);
  if (text === null || text.trim() === "") {
    return [];
  }

  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as T);
}

export async function listFiles(directory: string, suffix: string): Promise<string[]> {
  try {
    const names = await readdir(directory, { withFileTypes: true });
    return names
      .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
      .map((entry) => entry.name);
  } catch (error) {
    if (isNotFound(error)) {
      return [];
    }
    throw error;
  }
}

export async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${randomUUID()}`;
  const content = `${JSON.stringify(value)}\n`;

  await writeFile(tempPath, content, "utf8");
  try {
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}

export async function appendJsonLines(filePath: string, values: readonly unknown[]): Promise<void> {
  if (values.length === 0) {
    return;
  }

  await mkdir(dirname(filePath), { recursive: true });
  const content = `${values.map((value) => JSON.stringify(value)).join("\n")}\n`;
  await appendFile(filePath, content, "utf8");
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

export async function deleteFileIfExists(filePath: string): Promise<void> {
  await rm(filePath, { force: true });
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
