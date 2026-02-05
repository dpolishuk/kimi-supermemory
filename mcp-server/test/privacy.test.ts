import assert from "node:assert";
import { containsPrivateTag, stripPrivateContent, isFullyPrivate, hasNonPrivateContent } from "../src/services/privacy.js";

describe("Privacy Filtering", () => {
  describe("containsPrivateTag", () => {
    it("should detect <private> tags", () => {
      assert.strictEqual(containsPrivateTag("API key is <private>sk-abc123</private>"), true);
      assert.strictEqual(containsPrivateTag("Use <private>don't hardcode keys</private>"), true);
    });

    it("should be case-insensitive", () => {
      assert.strictEqual(containsPrivateTag("<PRIVATE>SECRET</PRIVATE>"), true);
      assert.strictEqual(containsPrivateTag("<PrIvAtE>SECRET</prIvAte>"), true);
    });

    it("should return false for normal content", () => {
      assert.strictEqual(containsPrivateTag("Use environment variables"), false);
      assert.strictEqual(containsPrivateTag("Don't hardcode keys"), false);
    });
  });

  describe("stripPrivateContent", () => {
    it("should replace <private> tags with [REDACTED]", () => {
      assert.strictEqual(
        stripPrivateContent("API key is <private>sk-abc123</private>"),
        "API key is [REDACTED]"
      );
      assert.strictEqual(
        stripPrivateContent("<private>Don't hardcode credentials</private>"),
        "[REDACTED]"
      );
    });

    it("should handle multiple private sections", () => {
      assert.strictEqual(
        stripPrivateContent("<private>Secret1</private> and <private>Secret2</private>"),
        "[REDACTED] and [REDACTED]"
      );
    });

    it("should preserve non-private content", () => {
      assert.strictEqual(
        stripPrivateContent("Use env vars. <private>API key should not be in repo.</private> Use .env files."),
        "Use env vars. [REDACTED] Use .env files."
      );
    });

    it("should handle empty content", () => {
      assert.strictEqual(stripPrivateContent(""), "");
      assert.strictEqual(stripPrivateContent("no private tags"), "no private tags");
    });

    it("should handle malformed tags", () => {
      assert.strictEqual(
        stripPrivateContent("<private>unclosed tag"),
        "<private>unclosed tag"
      );
    });
  });

  describe("isFullyPrivate", () => {
    it("should return true for fully private content", () => {
      assert.strictEqual(isFullyPrivate("<private>all private</private>"), true);
      assert.strictEqual(isFullyPrivate("<private></private>"), true);
    });

    it("should return false for mixed content", () => {
      assert.strictEqual(
        isFullyPrivate("Use env vars. <private>no API keys</private>."),
        false
      );
      assert.strictEqual(
        isFullyPrivate("<private>secret</private> and more public text"),
        false
      );
    });

    it("should return false for no private content", () => {
      assert.strictEqual(isFullyPrivate("normal content"), false);
    });
  });

  describe("hasNonPrivateContent", () => {
    it("should return true for mixed content", () => {
      assert.strictEqual(hasNonPrivateContent("<private>secret</private> and public text"), true);
      assert.strictEqual(hasNonPrivateContent("Public. <private>secret</private>."), true);
    });

    it("should return false for fully private", () => {
      assert.strictEqual(hasNonPrivateContent("<private>all private</private>"), false);
      assert.strictEqual(hasNonPrivateContent("<private></private>"), false);
    });

    it("should return false for [REDACTED] placeholders", () => {
      assert.strictEqual(hasNonPrivateContent("[REDACTED]"), false);
    });

    it("should return false for mixed [REDACTED] placeholders", () => {
      assert.strictEqual(hasNonPrivateContent("[REDACTED]    "), false);
    });

    it("should return true only for actual non-redacted content", () => {
      assert.strictEqual(hasNonPrivateContent("actual text"), true);
      assert.strictEqual(hasNonPrivateContent("text with [REDACTED] and more"), true);
    });
  });
});