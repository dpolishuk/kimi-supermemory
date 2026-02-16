import assert from "node:assert";

describe("Context Format (OpenCode Style)", () => {
  
  // Helper function simulating the new format
  function formatContextOpenCode(profile: any, userMemories: any, projectMemories: any): string | null {
    const parts: string[] = ["[SUPERMEMORY]"];

    // User Profile section
    if (profile?.profile) {
      const { static: staticFacts, dynamic: dynamicFacts } = profile.profile;
      const allFacts = [
        ...(staticFacts || []),
        ...(dynamicFacts || []),
      ];

      if (allFacts.length > 0) {
        parts.push("\nUser Profile:");
        for (const fact of allFacts.slice(0, 5)) {
          if (fact.content || typeof fact === 'string') {
            parts.push(`- ${fact.content || fact}`);
          }
        }
      }
    }

    // Project Knowledge section (from listMemories - 100% similarity)
    const projectResults = projectMemories?.results || [];
    if (projectResults.length > 0) {
      parts.push("\nProject Knowledge:");
      for (const mem of projectResults) {
        const content = mem.memory || mem.chunk || mem.content || "";
        parts.push(`- [100%] ${content}`);
      }
    }

    // Relevant Memories section (from search - actual similarity)
    const userResults = userMemories?.results || [];
    if (userResults.length > 0) {
      parts.push("\nRelevant Memories:");
      for (const mem of userResults) {
        const similarity = Math.round((mem.similarity || 0) * 100);
        const content = mem.memory || mem.chunk || mem.content || "";
        parts.push(`- [${similarity}%] ${content}`);
      }
    }

    if (parts.length === 1) {
      return null;
    }

    return parts.join("\n");
  }

  describe("Header format", () => {
    it("should use [SUPERMEMORY] header not XML tags", () => {
      const context = formatContextOpenCode(
        { profile: { static: ["fact1"], dynamic: [] } },
        { results: [] },
        { results: [] }
      );

      assert.ok(context?.startsWith("[SUPERMEMORY]"), "Should start with [SUPERMEMORY]");
      assert.ok(!context?.includes("<supermemory-context>"), "Should not contain XML tags");
      assert.ok(!context?.includes("</supermemory-context>"), "Should not contain closing XML tags");
    });

    it("should return null for empty context", () => {
      const context = formatContextOpenCode(
        null,
        { results: [] },
        { results: [] }
      );

      assert.strictEqual(context, null, "Should return null when no data");
    });
  });

  describe("User Profile section", () => {
    it("should include User Profile section with facts", () => {
      const context = formatContextOpenCode(
        { 
          profile: { 
            static: ["Prefers TypeScript", "Uses Vim"], 
            dynamic: ["Working on auth"] 
          } 
        },
        { results: [] },
        { results: [] }
      );

      assert.ok(context?.includes("User Profile:"), "Should have User Profile section");
      assert.ok(context?.includes("- Prefers TypeScript"), "Should list static facts");
      assert.ok(context?.includes("- Uses Vim"), "Should list all static facts");
      assert.ok(context?.includes("- Working on auth"), "Should list dynamic facts");
    });

    it("should handle profile with content property", () => {
      const context = formatContextOpenCode(
        { 
          profile: { 
            static: [{ content: "Fact with content prop" }], 
            dynamic: [] 
          } 
        },
        { results: [] },
        { results: [] }
      );

      assert.ok(context?.includes("- Fact with content prop"), "Should extract content property");
    });

    it("should skip User Profile if no facts", () => {
      const context = formatContextOpenCode(
        { profile: { static: [], dynamic: [] } },
        { results: [{ memory: "Project memory", similarity: 1 }] },
        { results: [] }
      );

      assert.ok(!context?.includes("User Profile:"), "Should skip empty profile section");
    });
  });

  describe("Project Knowledge section", () => {
    it("should include Project Knowledge with [100%] scores", () => {
      const context = formatContextOpenCode(
        null,
        { results: [] },
        { 
          results: [
            { memory: "Uses PostgreSQL" },
            { memory: "JWT authentication" }
          ] 
        }
      );

      assert.ok(context?.includes("Project Knowledge:"), "Should have Project Knowledge section");
      assert.ok(context?.includes("- [100%] Uses PostgreSQL"), "Should show 100% for project memories");
      assert.ok(context?.includes("- [100%] JWT authentication"), "Should show 100% for all project memories");
    });

    it("should handle memory with chunk property", () => {
      const context = formatContextOpenCode(
        null,
        { results: [] },
        { results: [{ chunk: "Chunk content" }] }
      );

      assert.ok(context?.includes("- [100%] Chunk content"), "Should use chunk property");
    });

    it("should handle memory with content property", () => {
      const context = formatContextOpenCode(
        null,
        { results: [] },
        { results: [{ content: "Content property" }] }
      );

      assert.ok(context?.includes("- [100%] Content property"), "Should use content property");
    });
  });

  describe("Relevant Memories section", () => {
    it("should include Relevant Memories with similarity percentages", () => {
      const context = formatContextOpenCode(
        null,
        { 
          results: [
            { memory: "Similar memory 1", similarity: 0.823 },
            { memory: "Similar memory 2", similarity: 0.756 }
          ] 
        },
        { results: [] }
      );

      assert.ok(context?.includes("Relevant Memories:"), "Should have Relevant Memories section");
      assert.ok(context?.includes("- [82%] Similar memory 1"), "Should round 0.823 to [82%]");
      assert.ok(context?.includes("- [76%] Similar memory 2"), "Should round 0.756 to [76%]");
    });

    it("should handle 100% similarity", () => {
      const context = formatContextOpenCode(
        null,
        { results: [{ memory: "Exact match", similarity: 1.0 }] },
        { results: [] }
      );

      assert.ok(context?.includes("- [100%] Exact match"), "Should show [100%] for perfect match");
    });

    it("should handle 0% similarity", () => {
      const context = formatContextOpenCode(
        null,
        { results: [{ memory: "Low match", similarity: 0.0 }] },
        { results: [] }
      );

      assert.ok(context?.includes("- [0%] Low match"), "Should show [0%]");
    });

    it("should round to nearest percentage", () => {
      const context = formatContextOpenCode(
        null,
        { 
          results: [
            { memory: "A", similarity: 0.824 },
            { memory: "B", similarity: 0.825 },
            { memory: "C", similarity: 0.499 },
            { memory: "D", similarity: 0.501 }
          ] 
        },
        { results: [] }
      );

      assert.ok(context?.includes("- [82%] A"), "Should round 82.4 down to 82");
      assert.ok(context?.includes("- [83%] B"), "Should round 82.5 up to 83");
      assert.ok(context?.includes("- [50%] C"), "Should round 49.9 up to 50");
      assert.ok(context?.includes("- [50%] D"), "Should round 50.1 up to 50");
    });

    it("should handle undefined similarity", () => {
      const context = formatContextOpenCode(
        null,
        { results: [{ memory: "No score" }] },
        { results: [] }
      );

      assert.ok(context?.includes("- [0%] No score"), "Should default to 0% when undefined");
    });
  });

  describe("Full integration", () => {
    it("should format complete context with all sections", () => {
      const context = formatContextOpenCode(
        { 
          profile: { 
            static: ["Expert in React"], 
            dynamic: ["Learning Rust"] 
          } 
        },
        { 
          results: [
            { memory: "Similar pattern", similarity: 0.85 }
          ] 
        },
        { 
          results: [
            { memory: "Project setup" }
          ] 
        }
      );

      assert.ok(context?.startsWith("[SUPERMEMORY]"), "Should have header");
      assert.ok(context?.includes("User Profile:"), "Should have User Profile");
      assert.ok(context?.includes("Project Knowledge:"), "Should have Project Knowledge");
      assert.ok(context?.includes("Relevant Memories:"), "Should have Relevant Memories");
      assert.ok(context?.includes("- Expert in React"), "Should include profile facts");
      assert.ok(context?.includes("- [100%] Project setup"), "Should include project memories");
      assert.ok(context?.includes("- [85%] Similar pattern"), "Should include search results with scores");
    });

    it("should skip sections with no data", () => {
      const context = formatContextOpenCode(
        null,
        { results: [{ memory: "Only search result", similarity: 0.9 }] },
        { results: [] }
      );

      assert.ok(!context?.includes("User Profile:"), "Should skip empty profile");
      assert.ok(!context?.includes("Project Knowledge:"), "Should skip empty project knowledge");
      assert.ok(context?.includes("Relevant Memories:"), "Should have relevant memories");
    });
  });

  describe("Section ordering", () => {
    it("should order sections: User Profile, Project Knowledge, Relevant Memories", () => {
      const context = formatContextOpenCode(
        { profile: { static: ["Fact"], dynamic: [] } },
        { results: [{ memory: "Search", similarity: 0.8 }] },
        { results: [{ memory: "Project" }] }
      );

      const userProfileIndex = context?.indexOf("User Profile:") || -1;
      const projectKnowledgeIndex = context?.indexOf("Project Knowledge:") || -1;
      const relevantMemoriesIndex = context?.indexOf("Relevant Memories:") || -1;

      assert.ok(userProfileIndex < projectKnowledgeIndex, "User Profile should come before Project Knowledge");
      assert.ok(projectKnowledgeIndex < relevantMemoriesIndex, "Project Knowledge should come before Relevant Memories");
    });
  });
});
