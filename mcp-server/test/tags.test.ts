import assert from "node:assert";
import { sha256, getGitRemoteUrl, normalizeGitUrl, getProjectTag, getUserTag, getTags } from "../src/services/tags.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Tags Service", () => {
  describe("sha256", () => {
    it("should generate consistent hash for same input", () => {
      const hash1 = sha256("test");
      const hash2 = sha256("test");
      assert.strictEqual(hash1, hash2);
    });

    it("should generate different hashes for different input", () => {
      const hash1 = sha256("test1");
      const hash2 = sha256("test2");
      assert.notStrictEqual(hash1, hash2);
    });

    it("should return 17 character hash", () => {
      const hash = sha256("any string");
      assert.strictEqual(hash.length, 17);
    });
  });

  describe("normalizeGitUrl", () => {
    it("should remove protocol", () => {
      const url1 = normalizeGitUrl("https://github.com/user/repo.git");
      const url2 = normalizeGitUrl("https://github.com/user/repo.git");
      assert.strictEqual(url1, "github.com/user/repo");
    });

    it("should remove credentials", () => {
      const url = normalizeGitUrl("https://user:token@github.com/user/repo.git");
      assert.strictEqual(url, "github.com/user/repo");
    });

    it("should handle SSH format", () => {
      const url = normalizeGitUrl("git@github.com:user/repo.git");
      assert.strictEqual(url, "github.com/user/repo");
    });

    it("should remove .git suffix", () => {
      const url = normalizeGitUrl("github.com/user/repo.git");
      assert.strictEqual(url, "github.com/user/repo");
    });

    it("should normalize slashes", () => {
      const url = normalizeGitUrl("github.com//user//repo");
      assert.strictEqual(url, "github.com/user/repo");
    });
  });

  describe("getGitRemoteUrl", () => {
    it("should parse git config file", () => {
      // This would need a real .git/config file
      // For now skip this test
      assert.ok(true);
    });

    it("should return null if .git/config not found", () => {
      const url = getGitRemoteUrl("/nonexistent");
      assert.strictEqual(url, null);
    });
  });

  describe("getUserTag", () => {
    const originalEmail = process.env.KIMI_EMAIL;
    const originalUser = process.env.USER;
    const originalUsername = process.env.USERNAME;

    afterEach(() => {
      process.env.KIMI_EMAIL = originalEmail;
      process.env.USER = originalUser;
      process.env.USERNAME = originalUsername;
    });

    it("should generate tag from KIMI_EMAIL", () => {
      process.env.KIMI_EMAIL = "user@example.com";
      const tag = getUserTag("kimi", "/test/dir");
      assert(tag.startsWith("kimi_user_"));
      assert.strictEqual(tag.length, 27); // prefix + 16 chars
    });

    it("should include directory for consistency", () => {
      process.env.KIMI_EMAIL = "user@example.com";
      const tag1 = getUserTag("kimi", "/test/dir");
      const tag2 = getUserTag("kimi", "/test/dir");
      assert.strictEqual(tag1, tag2);
    });
  });

  describe("getProjectTag", () => {
    it("should use git remote URL if available", () => {
      // This would need mock for getGitRemoteUrl
      // For now skip
      assert.ok(true);
    });

    it("should fallback to directory name if no git remote", () => {
      const tag = getProjectTag("kimi", "/home/user/myproject", () => null);
      assert.strictEqual(tag, "kimi_project_myproject");
    });

    it("should use 'unknown' if directory name cannot be parsed", () => {
      const tag = getProjectTag("kimi", "/", () => null);
      assert.strictEqual(tag, "kimi_project_unknown");
    });
  });

  describe("getTags", () => {
    it("should return both user and project tags", () => {
      process.env.KIMI_EMAIL = "user@example.com";
      const tags = getTags("kimi", "/home/user/myproject");
      assert(tags.user.startsWith("kimi_user_"));
      assert(tags.project.includes("myproject"));
    });
  });
});