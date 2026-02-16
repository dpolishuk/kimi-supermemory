---
name: kimi-supermemory
description: Persistent memory for Kimi CLI using Supermemory. Provides 6 tools: add, search, get_context, list, forget, profile. Features hash-based scoping, privacy filtering, and configurability.
---

# Kimi Supermemory

This skill enables persistent memory across Kimi CLI sessions using [Supermemory](https://supermemory.ai).

## Features

- **6 MCP Tools**: add, search, get_context, list, forget, profile
- **Hash-Based Scoping**: User and project tags for organized memory
- **Privacy Filtering**: `<private>` tags protect sensitive content
- **Configuration**: JSONC config file with environment variable fallback
- **Structured Logging**: Timestamped logs to ~/.kimi-supermemory.log
- **Project-Aware**: Memories organized by project directory

## Quick Start

### Automatic Installation

```bash
# Run the install script
chmod +x install.sh && ./install.sh
```

This script:
- Builds the MCP server
- Registers with kimi-cli: `kimi mcp add`
- Installs SKILL.md to `~/.config/agents/skills/kimi-supermemory/`
- Sets up basic configuration

### Manual Installation

```bash
# Clone and setup
git clone https://github.com/dpolishuk/kimi-supermemory.git
cd kimi-supermemory/mcp-server
npm install && npm run build

# Register with kimi-cli
kimi mcp add --transport stdio supermemory -- node /path/to/kimi-supermemory/mcp-server/dist/server.cjs

# Set API key
export SUPERMEMORY_API_KEY="sm_..."
```

Get your API key at [console.supermemory.ai](https://console.supermemory.ai).

## Configuration

### Configuration File

Create `~/.config/kimi/supermemory.jsonc` or `~/.config/kimi/supermemory.json`:

```jsonc
{
  // API settings (environment variables take precedence)
  "apiKey": "sm_...",
  "apiUrl": "https://api.supermemory.ai",

  // Debug mode (enables verbose logging to stderr)
  "debug": false,

  // Keyword patterns for automatic memory capture
  "keywordPatterns": ["decided:", "prefer:", "always:", "never:", "note: "],

  // Semantic search settings
  "similarityThreshold": 0.6,
  "maxResults": 10,

  // Memory limits
  "memoryTypes": 6,
  "compactSize": 50
}
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPERMEMORY_API_KEY` | Your Supermemory API key | Yes |
| `SUPERMEMORY_API_URL` | API endpoint (default: https://api.supermemory.ai) | No |
| `KIMI_EMAIL` | Email for user tag generation (fallback to USER env var) | No |
| `SUPERMEMORY_DEBUG` | Enable debug logging (true/false) | No |

## Privacy

### `<private>` Tags

Wrap sensitive content in `<private>` tags to prevent storage:

```
<private>
My API key is: sk-12345
</private>
```

**Privacy Rules:**
- Content inside `<private>` tags is replaced with `[REDACTED]`
- Fully-private content (only `[REDACTED]` remains) is rejected
- Case-insensitive: `<private>`, `<PRIVATE>`, `<PrIvAtE>` all work
- Nested tags are handled correctly

### Hash-Based Scoping

Memories are organized using hash-based tags:

**User Tag:**`kimi_user_{sha256(KIMI_EMAIL)}`- Unique identifier for your profile
- Falls back to `USER` or `USERNAME` if `KIMI_EMAIL` not set

**Project Tag:**`kimi_project_{sha256(normalized_git_url)}`- Stable across machines
- Falls back to directory name if not a git repo

Git URL normalization removes:- Protocols (https://, git@)
- Credentials (user:pass@)
- `.git` suffix

## Memory Types

Use these 6 categories when adding memories:

| Type | Description | Example |
|------|-------------|---------|
| `project-config` | Project setup, architecture, dependencies | "Using TypeScript 5.0 with Bun runtime" |
| `architecture` | System design, patterns, conventions | "MVC pattern with service layer" |
| `error-solution` | Bugs and fixes | "Fixed race condition with mutex" |
| `preference` | Tool choices, workflows | "Prefer Prettier over ESLint format" |
| `learned-pattern` | Solutions discovered | "Use .env files for secrets management" |
| `conversation` | Session summaries, decisions | "Decided to move from REST to GraphQL" |

## MCP Tools

### Unified Tool (Recommended)

### 1. supermemory

Manage and query Supermemory with a single tool using `mode` parameter.

**Parameters:**
- `mode` (required): "add", "search", "profile", "list", "forget", or "help"
- `content` (for add): Memory text to save
- `query` (for search/profile): Search query
- `scope` (optional): "user" (cross-project) or "project" (default)
- `type` (for add): Memory type classification
- `memoryId` (for forget): ID of memory to delete
- `limit` (for list/search): Max results

**Examples:**
```
# Add a memory
Use tool: supermemory
mode: "add"
content: "Uses TypeScript with strict mode"
scope: "project"
type: "project-config"

# Search memories
Use tool: supermemory
mode: "search"
query: "authentication"
scope: "user"

# Get help
Use tool: supermemory
mode: "help"
```

### Individual Tools (Legacy)

### 2. supermemory_add

Save a memory for future recall.

**Parameters:**
- `content` (required): The memory text
- `containerTag` (optional): Project-specific tag
- `metadata` (optional): Additional context

**Example:**
```
Use tool: supermemory_add
content: "Decided to use PostgreSQL for transaction support"
metadata: { type: "conversation" }
```

### 3. supermemory_search

Search your coding history.

**Parameters:**
- `query` (required): Search query
- `containerTag` (optional): Project scope
- `limit` (optional): Max results (default: 10)

**Example:**
```
Use tool: supermemory_search
query: "authentication implementation"
```

### 4. supermemory_get_context

Fetch profile and project context (auto-called on session start).

**Parameters:**
- `cwd` (optional): Working directory (auto-detected)
- `projectName` (optional): Project name

**Example:**
```
Use tool: supermemory_get_context
cwd: "/path/to/project"
projectName: "my-app"
```

### 5. supermemory_list

List recent memories for a project.

**Parameters:**
- `containerTag` (optional): Project scope
- `limit` (optional): Max memories (default: 20)

**Example:**
```
Use tool: supermemory_list
limit: 10
```

### 6. supermemory_forget

Delete a specific memory.

**Parameters:**
- `memoryId` (required): ID of memory to delete

**Example:**
```
Use tool: supermemory_forget
memoryId: "123456"
```

### 7. supermemory_profile

Get user profile facts and preferences.

**Parameters:**
- `query` (optional): Filter profile facts

**Example:**
```
Use tool: supermemory_profile
query: "editor"
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPERMEMORY_API_KEY` | Your Supermemory API key | Yes |
| `SUPERMEMORY_DEBUG` | Enable debug logging | No |

## Workflow

### Session Start (Automatic)

1. Generate user tag from `KIMI_EMAIL` (or `USER`)
2. Generate project tag from git remote URL (or directory name)
3. Fetch user profile with `supermemory_profile`
4. Get project context with `supermemory_get_context`
5. Inject `[SUPERMEMORY]` context with relevant memories

### During Development (Agent-Driven)

When you make decisions or solve problems, the agent should:

```
Use tool: supermemory_add
content: "Decided to use PostgreSQL over MongoDB for transaction support"
metadata: { type: "conversation" }
```

**Key Decision Points to Remember:**
- Architecture choices and trade-offs
- Performance optimizations
- Bug solutions and root causes
- Technology preferences and anti-patterns

### Automatic Memory Capture

The agent watches for keywords indicating the user wants something remembered.

#### Trigger Keywords

When the user says any of these, **automatically save to memory**:
- "remember", "memorize", "save this"
- "note this", "keep in mind"
- "don't forget", "learn this"
- "jot down", "make a note"
- "take note", "commit to memory"
- "remember that", "never forget"

#### Memory Nudge

When trigger keywords are detected, the agent should save the information:

```
[MEMORY TRIGGER DETECTED]
The user wants you to remember something. 

Use the unified supermemory tool:
- mode: "add"
- scope: "project" (for project-specific) or "user" (for cross-project preferences)
- type: appropriate category (preference, project-config, etc.)
```

#### What to Remember

| Type | Examples |
|------|----------|
| **preference** | "Always use TypeScript", "Prefer Bun over npm" |
| **project-config** | "Node 18 required", "Uses pnpm workspaces" |
| **architecture** | "MVC pattern", "Microservices approach" |
| **error-solution** | "Fixed by clearing cache", "Race condition solved with mutex" |
| **learned-pattern** | "Use dependency injection", "Abstract database layer" |
| **conversation** | "Decided to migrate to v2", "Agreed on API design" |

#### Using the Unified Tool

For automatic captures, use the unified `supermemory` tool:

```
Use tool: supermemory
mode: "add"
content: "User prefers arrow functions over regular functions"
scope: "user"
type: "preference"
```

**Scope selection:**
- `scope: "user"` - Cross-project preferences (coding style, tools)
- `scope: "project"` - Project-specific knowledge (default)

### Privacy Filter

All outgoing content is stripped of `<private>` tags:

```
<private>secret_key_here</private>
<private></private>
```

**Examples:**
- ❌ `<private>API key is sk-12345</private>` → Rejects (fully private)
- ✓ `<private>API key is sk-12345</private> Use env vars instead` → Saves (strips key)
- ✓ `Use the .env file for secrets` → Saves (no private tags)

## Logs

Logs are written to `~/.kimi-supermemory.log`:

```
[2026-02-05T14:00:00.000Z] [INFO] Kimi Supermemory MCP server starting
[2026-02-05T14:00:01.123Z] [INFO] Memory saved successfully (ID: abc123)
[2026-02-05T14:00:02.456Z] [WARN] Config file not found, using defaults
[2026-02-05T14:00:03.789Z] [ERROR] API request failed: Connection timeout
```

**Log Levels:**
- INFO: Normal operations
- WARN: Non-critical issues
- ERROR: Failures with data loss risk
- DEBUG: Verbose (only when `config.debug = true`)

## Project Structure

```
kimi-supermemory/
├── mcp-server/
│   ├── src/
│   │   ├── server.js           # MCP server with 6 tools
│   │   ├── lib/
│   │   │   └── supermemory-client.js  # API client
│   │   ├── services/
│   │   │   ├── config.ts       # Configuration loader
│   │   │   ├── logger.ts       # Structured logging
│   │   │   ├── privacy.ts      # Privacy filtering
│   │   │   └── tags.ts         # Hash-based scoping
│   │   └── format-context.js   # Context formatting
│   ├── dist/
│   │   └── server.cjs          # Built server (CommonJS)
│   └── test/
│       ├── config.test.ts
│       ├── logger.test.ts
│       ├── privacy.test.ts
│       └── tags.test.ts
├── skill/
│   └── SKILL.md                # This file
└── install.sh                   # Installation script
```
