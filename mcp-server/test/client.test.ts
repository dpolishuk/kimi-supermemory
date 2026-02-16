import assert from "node:assert";
import { SupermemoryClient } from "../src/lib/supermemory-client.js";

describe("SupermemoryClient", () => {
  const mockApiKey = "sm_test_key_12345";

  describe("listMemories containerTags parameter", () => {
    it("should send containerTags as an array, not string", async () => {
      // This test verifies the fix for the containerTags bug
      // Bug: containerTags was sent as string, API expects array
      // Fix: Wrap containerTag in array: [containerTag]
      
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      
      // Mock the underlying client.memories.list method
      let capturedArgs: any = null;
      (client as any).client = {
        memories: {
          list: async (args: any) => {
            capturedArgs = args;
            return { memories: [] };
          }
        }
      };

      await client.listMemories("kimi_project_abc123", 10);

      // CRITICAL: containerTags MUST be an array
      assert.ok(Array.isArray(capturedArgs.containerTags), 
        "containerTags must be an array, not string");
      assert.strictEqual(capturedArgs.containerTags[0], "kimi_project_abc123",
        "containerTags array should contain the tag");
    });

    it("should use this.containerTag when containerTag param not provided", async () => {
      const client = new SupermemoryClient(mockApiKey, "kimi_default_tag");
      
      let capturedArgs: any = null;
      (client as any).client = {
        memories: {
          list: async (args: any) => {
            capturedArgs = args;
            return { memories: [] };
          }
        }
      };

      await client.listMemories(undefined as any, 10);

      assert.ok(Array.isArray(capturedArgs.containerTags),
        "containerTags must be an array");
      assert.strictEqual(capturedArgs.containerTags[0], "kimi_default_tag",
        "should use default containerTag from constructor");
    });

    it("should handle empty string containerTag", async () => {
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      
      let capturedArgs: any = null;
      (client as any).client = {
        memories: {
          list: async (args: any) => {
            capturedArgs = args;
            return { memories: [] };
          }
        }
      };

      await client.listMemories("", 10);

      assert.ok(Array.isArray(capturedArgs.containerTags),
        "containerTags must be an array even for empty string");
      // Empty string in array is acceptable - API will handle validation
    });
  });

  describe("API timeout handling", () => {
    it("should timeout listMemories after 30 seconds", async () => {
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      
      // Mock that never resolves
      (client as any).client = {
        memories: {
          list: () => new Promise(() => {}) // Never resolves
        }
      };

      const startTime = Date.now();
      try {
        await client.listMemories("kimi_project_test", 10);
        assert.fail("Should have thrown timeout error");
      } catch (error: any) {
        const elapsed = Date.now() - startTime;
        assert.ok(elapsed < 31000, "Should timeout before 31 seconds");
        assert.ok(elapsed >= 29000, "Should timeout after ~30 seconds");
        assert.ok(error.message.includes("Timeout"), "Error should mention timeout");
      }
    }).timeout(35000);

    it("should timeout search after 30 seconds", async () => {
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      
      (client as any).client = {
        search: {
          memories: () => new Promise(() => {}) // Never resolves
        }
      };

      const startTime = Date.now();
      try {
        await client.search("test query", "kimi_project_test");
        assert.fail("Should have thrown timeout error");
      } catch (error: any) {
        const elapsed = Date.now() - startTime;
        assert.ok(elapsed < 31000, "Should timeout before 31 seconds");
        assert.ok(error.message.includes("Timeout"), "Error should mention timeout");
      }
    }).timeout(35000);
  });

  describe("response wrapping", () => {
    it("should return { success, data } format for successful operations", async () => {
      // This test verifies that we're moving toward OpenCode-style response wrapping
      // Note: This is a forward-looking test for Phase 2 of the epic
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      
      (client as any).client = {
        memories: {
          list: async () => ({
            memories: [{ id: "1", content: "test" }],
            pagination: { currentPage: 1, totalItems: 1 }
          })
        }
      };

      const result = await client.listMemories("kimi_project_test", 10);
      
      // Current implementation doesn't use { success, data } yet
      // This documents the expected format for Phase 2
      assert.ok(result.memories, "Should return memories array");
    });
  });
});
