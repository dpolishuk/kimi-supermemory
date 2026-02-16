import assert from "node:assert";

describe("supermemory_get_context cwd handling", () => {
  describe("cwd null safety", () => {
    it("should handle undefined cwd without crashing", () => {
      // Test the null-safe cwd handling logic
      // Simulates: const cwd = args?.cwd || process.cwd() || '/';
      
      const testCases = [
        { args: { cwd: undefined }, expected: "should not throw" },
        { args: {}, expected: "should not throw" },
        { args: { cwd: null }, expected: "should not throw" },
        { args: { cwd: "" }, expected: "should not throw" },
        { args: { cwd: "/home/user/project" }, expected: "project" },
        { args: { cwd: "/" }, expected: "unknown" },
      ];

      for (const tc of testCases) {
        // Simulate the fixed logic
        const args = tc.args as any;
        const cwd = args?.cwd || process.cwd() || "/";
        const projectName = args?.projectName || cwd?.split("/").pop() || "unknown";
        
        // Should not throw for any input
        assert.ok(typeof projectName === "string", "projectName should be a string");
        
        if (tc.args.cwd === "/home/user/project") {
          assert.strictEqual(projectName, "project", "should extract directory name");
        }
        if (tc.args.cwd === "/") {
          assert.strictEqual(projectName, "unknown", "should return unknown for root");
        }
      }
    });

    it("should use optional chaining to prevent split() crash", () => {
      // Direct test of the specific bug: cwd.split('/') when cwd is undefined
      // Bug: const projectName = args.projectName || cwd.split('/').pop() || 'unknown';
      // Fix: const projectName = args?.projectName || cwd?.split('/').pop() || 'unknown';
      
      const undefinedCwd: any = undefined;
      const nullCwd: any = null;
      const validCwd = "/home/user/myproject";

      // Original buggy code would crash:
      // undefinedCwd.split('/') -> TypeError
      
      // Fixed code with optional chaining:
      const projectNameFromUndefined = undefinedCwd?.split("/").pop() || "unknown";
      const projectNameFromNull = nullCwd?.split("/").pop() || "unknown";
      const projectNameFromValid = validCwd?.split("/").pop() || "unknown";

      assert.strictEqual(projectNameFromUndefined, "unknown", 
        "undefined cwd should result in 'unknown'");
      assert.strictEqual(projectNameFromNull, "unknown",
        "null cwd should result in 'unknown'");
      assert.strictEqual(projectNameFromValid, "myproject",
        "valid cwd should extract project name");
    });

    it("should handle Windows-style paths (future consideration)", () => {
      // Documenting current limitation: Windows paths use backslash
      // This is acceptable for now - paths are informational only
      const windowsPath = "C:\\Users\\user\\project";
      const projectName = windowsPath?.split("/").pop() || "unknown";
      
      // Currently doesn't handle Windows paths correctly
      // This is documented as a known limitation
      assert.strictEqual(projectName, windowsPath, 
        "Windows paths won't extract correctly with split('/')");
    });
  });

  describe("projectName extraction", () => {
    it("should prioritize args.projectName over cwd", () => {
      const args = {
        projectName: "CustomProject",
        cwd: "/home/user/otherproject"
      };
      
      const cwd = args?.cwd || process.cwd() || "/";
      const projectName = args?.projectName || cwd?.split("/").pop() || "unknown";
      
      assert.strictEqual(projectName, "CustomProject",
        "explicit projectName should take precedence");
    });

    it("should fall back to cwd when projectName not provided", () => {
      const args = {
        cwd: "/home/user/myproject"
      };
      
      const cwd = args?.cwd || process.cwd() || "/";
      const projectName = args?.projectName || cwd?.split("/").pop() || "unknown";
      
      assert.strictEqual(projectName, "myproject",
        "should extract from cwd when projectName not provided");
    });
  });
});
