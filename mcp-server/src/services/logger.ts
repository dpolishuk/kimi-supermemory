import { join, dirname } from "node:path";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir as osHomedir } from "node:os";

const HOMEDIR = osHomedir();
const LOG_FILE = join(HOMEDIR, ".kimi-supermemory.log");

export function ensureLogFile(): void {
  const logDir = dirname(LOG_FILE);
  if (!existsSync(logDir)) {
    try {
      mkdirSync(logDir, { recursive: true });
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`Failed to create log directory: ${err.message}`);
    }
  }
}

export function log(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const formattedData = data !== undefined ? ` ${JSON.stringify(data)}` : "";
  const line = `[${timestamp}] ${message}${formattedData}\n`;
  
  try {
    appendFileSync(LOG_FILE, line);
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Failed to write log: ${err.message}`);
  }
}

let debugMode = false;

export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

export function logDebug(message: string, data?: unknown): void {
  if (debugMode) {
    log(`[DEBUG] ${message}`, data);
  }
}

export function logInfo(message: string): void {
  log(`[INFO] ${message}`);
}

export function logWarn(message: string): void {
  log(`[WARN] ${message}`);
}

export function logError(message: string, data?: unknown): void {
  log(`[ERROR] ${message}`, data);
}
