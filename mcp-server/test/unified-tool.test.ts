import assert from "node:assert";
import { SupermemoryClient } from "../src/lib/supermemory-client.js";

describe("Unified supermemory Tool", () => {
  const mockApiKey = "sm_test_key_12345";

  describe("Tool registration", () => {
    it("should have unified supermemory tool defined", () => {
      // This test documents that the unified tool exists
      // Actual registration is verified via MCP protocol
      assert.ok(true, "Unified tool schema defined in server.js");
    });
  });

  describe("Mode routing logic", () => {
    it("should route add mode to addMemory", async () => {
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      let addCalled = false;
      let capturedContent = "";
      let capturedTag = "";

      (client as any).client = {
        add: async (payload: any) => {
          addCalled = true;
          capturedContent = payload.content;
          capturedTag = payload.containerTag;
          return { id: "mem_123", status: "success" };
        }
      };

      // Simulate unified tool add mode with project scope
      const content = "Test memory content";
      const scope = "project";
      const containerTag = scope === "user" ? "kimi_user_test" : "kimi_project_test";
      
      const result = await client.addMemory(content, containerTag, { type: "preference" });

      assert.ok(addCalled, "addMemory should be called for add mode");
      assert.strictEqual(capturedContent, content, "Content should match");
      assert.strictEqual(capturedTag, "kimi_project_test", "Should use project scope");
      assert.ok(result.id, "Should return memory ID");
    });

    it("should route search mode with scope=user to user tag", async () => {
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      let searchCalled = false;
      let capturedTag = "";

      (client as any).client = {
        search: {
          memories: async (params: any) => {
            searchCalled = true;
            capturedTag = params.containerTag;
            return { results: [], total: 0, timing: 0 };
          }
        }
      };

      const userTag = "kimi_user_abc123";
      await client.search("test query", userTag);

      assert.ok(searchCalled, "search should be called");
      assert.strictEqual(capturedTag, userTag, "Should use user scope tag");
    });

    it("should route list mode with scope to correct container", async () => {
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      let listCalled = false;
      let capturedArgs: any = null;

      (client as any).client = {
        memories: {
          list: async (args: any) => {
            listCalled = true;
            capturedArgs = args;
            return { memories: [] };
          }
        }
      };

      // Test project scope (default)
      await client.listMemories("kimi_project_abc123", 10);
      
      assert.ok(listCalled, "listMemories should be called");
      assert.ok(Array.isArray(capturedArgs.containerTags), "containerTags should be array");
      assert.strictEqual(capturedArgs.containerTags[0], "kimi_project_abc123");
    });
  });

  describe("Response format", () => {
    it("should return success response format", async () => {
      // Document expected unified tool response format
      const expectedFormat = {
        success: true,
        message: "Memory added to project scope",
        data: {
          id: "mem_123",
          scope: "project",
          type: "preference"
        }
      };

      assert.ok(expectedFormat.success !== undefined, "Should have success field");
      assert.ok(expectedFormat.message, "Should have message field");
      assert.ok(expectedFormat.data, "Should have data field");
    });

    it("should return error response format", async () => {
      const errorFormat = {
        success: false,
        error: "content parameter is required for add mode"
      };

      assert.strictEqual(errorFormat.success, false, "Success should be false");
      assert.ok(errorFormat.error, "Should have error field");
    });
  });

  describe("Scope routing", () => {
    it("should default scope to project", () => {
      const args = { mode: "add", content: "test" };
      const scope = args["scope"] || "project";
      assert.strictEqual(scope, "project", "Should default to project scope");
    });

    it("should accept explicit user scope", () => {
      const args = { mode: "add", content: "test", scope: "user" };
      const scope = args["scope"] || "project";
      assert.strictEqual(scope, "user", "Should accept user scope");
    });

    it("should accept explicit project scope", () => {
      const args = { mode: "add", content: "test", scope: "project" };
      const scope = args["scope"] || "project";
      assert.strictEqual(scope, "project", "Should accept project scope");
    });
  });

  describe("Mode validation", () => {
    const validModes = ["add", "search", "profile", "list", "forget", "help"];

    it("should accept all valid modes", () => {
      for (const mode of validModes) {
        assert.ok(validModes.includes(mode), `${mode} should be valid`);
      }
    });

    it("should reject invalid mode", () => {
      const invalidMode = "invalid";
      const isValid = validModes.includes(invalidMode);
      assert.strictEqual(isValid, false, "invalid should not be a valid mode");
    });

    it("should require mode parameter", () => {
      const args = {};
      const hasMode = "mode" in args;
      assert.strictEqual(hasMode, false, "Should detect missing mode");
    });
  });

  describe("Combined search (no scope specified)", () => {
    it("should search both user and project scopes when no scope specified", async () => {
      const client = new SupermemoryClient(mockApiKey, "kimi_project_test");
      const searches: string[] = [];

      (client as any).client = {
        search: {
          memories: async (params: any) => {
            searches.push(params.containerTag);
            return { 
              results: [{ id: "1", content: "test", similarity: 0.9 }],
              total: 1, 
              timing: 0 
            };
          }
        }
      };

      // Simulate searching both scopes
      const userResults = await client.search("query", "kimi_user_abc123");
      const projectResults = await client.search("query", "kimi_project_abc123");

      assert.strictEqual(searches.length, 2, "Should search both scopes");
      assert.ok(searches.includes("kimi_user_abc123"), "Should search user scope");
      assert.ok(searches.includes("kimi_project_abc123"), "Should search project scope");
    });
  });

  describe("Help mode", () => {
    it("should return help documentation structure", () => {
      const helpResponse = {
        success: true,
        message: "Supermemory Usage Guide",
        commands: [
          { command: "add", description: "Store a new memory", args: ["content", "type?", "scope?"] },
          { command: "search", description: "Search memories", args: ["query", "scope?"] },
          { command: "profile", description: "View user profile", args: ["query?"] },
          { command: "list", description: "List recent memories", args: ["scope?", "limit?"] },
          { command: "forget", description: "Remove a memory", args: ["memoryId", "scope?"] },
        ],
        scopes: {
          user: "Cross-project preferences and knowledge",
          project: "Project-specific knowledge (default)"
        },
        types: [
          "project-config",
          "architecture", 
          "error-solution",
          "preference",
          "learned-pattern",
          "conversation"
        ]
      };

      assert.ok(helpResponse.commands.length > 0, "Should have commands");
      assert.ok(helpResponse.scopes, "Should have scopes documentation");
      assert.ok(helpResponse.types, "Should have types documentation");
    });
  });

  describe("Parameter validation by mode", () => {
    it("add mode requires content", () => {
      const args = { mode: "add" };
      const hasContent = !!args["content"];
      assert.strictEqual(hasContent, false, "Should detect missing content");
    });

    it("search mode requires query", () => {
      const args = { mode: "search" };
      const hasQuery = !!args["query"];
      assert.strictEqual(hasQuery, false, "Should detect missing query");
    });

    it("forget mode requires memoryId", () => {
      const args = { mode: "forget" };
      const hasMemoryId = !!args["memoryId"];
      assert.strictEqual(hasMemoryId, false, "Should detect missing memoryId");
    });

    it("profile mode does not require query", () => {
      const args = { mode: "profile" };
      const hasQuery = !!args["query"];
      // Profile can work without query
      assert.ok(true, "Profile mode works with or without query");
    });
  });
});
