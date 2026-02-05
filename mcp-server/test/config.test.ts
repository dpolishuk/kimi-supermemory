import assert from "node:assert";
import { loadConfig } from "../src/services/config.js";

describe("Config Loading", () => {
  it("should load from JSONC file when present", () => {
    process.env.SUPERMEMORY_API_KEY = "sm_test_key";
    const config = loadConfig();
    assert.strictEqual(config.apiKey, "sm_test_key");
    assert.strictEqual(config.similarityThreshold, 0.6);
    assert.strictEqual(config.maxMemories, 5);
  });

  it("should use environment variable overrides", () => {
    process.env.SUPERMEMORY_API_KEY = "sm_env_key";
    process.env.SUPERMEMORY_API_URL = "https://custom.api";
    const config = loadConfig();
    assert.strictEqual(config.apiKey, "sm_env_key");
    assert.strictEqual(config.apiUrl, "https://custom.api");
  });

  it("should apply defaults when config file missing", () => {
    process.env.SUPERMEMORY_API_KEY = "sm_test";
    const config = loadConfig();
    assert.strictEqual(config.containerTagPrefix, "kimi");
    assert.strictEqual(config.injectProfile, true);
    assert.strictEqual(config.debug, false);
  });

  it("should handle invalid JSON gracefully", () => {
    const originalKey = process.env.SUPERMEMORY_API_KEY;
    process.env.SUPERMEMORY_API_KEY = "sm_fallback";
    const config = loadConfig();
    assert.strictEqual(config.apiKey, "sm_fallback");
    process.env.SUPERMEMORY_API_KEY = originalKey;
  });
});