import assert from "assert";
import fs from "node:fs";
import path from "node:path";
import { logInfo, logWarn, logError, logDebug, setDebugMode } from "../src/services/logger.js";
import { ensureLogFile } from "../src/services/logger.js";

describe("Logger", () => {
  const testLogPath = process.env.HOME + "/.kimi-supermemory.log";

  before(() => {
    setDebugMode(true);
  });

  it("should format timestamps in ISO format", () => {
    const before = new Date();
    logInfo("Test message");
    logWarn("Warning message");
    logError("Error message");
    const after = new Date();

    const logContent = fs.readFileSync(testLogPath, "utf-8");
    const lines = logContent.split("\n").filter((l) => l.includes("Test message"));
    assert(lines.length > 0);

    const timestamp = lines[0].match(/\[(.*?)\]/)?.[1];
    const logTime = new Date(timestamp!);
    assert(logTime >= before && logTime <= after);
  });

  it("should log at correct levels", () => {
    logInfo("info message");
    logWarn("warn message");
    logError("error message");
    logDebug("debug message");

    const logContent = fs.readFileSync(testLogPath, "utf-8");
    assert(logContent.includes("[INFO] info message"));
    assert(logContent.includes("[WARN] warn message"));
    assert(logContent.includes("[ERROR] error message"));
    assert(logContent.includes("[DEBUG] debug message"));
  });

  it("should create log file directory if missing", () => {
    const logDir = path.dirname(testLogPath);
    
    if (fs.existsSync(testLogPath)) {
      fs.unlinkSync(testLogPath);
    }
    
    ensureLogFile();
    assert(fs.existsSync(logDir));
  });
});