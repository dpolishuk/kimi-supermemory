---
name: kimi-supermemory
description: Persistent memory for Kimi CLI using Supermemory. Automatically recalls context at session start, captures conversation memories, and enables memory search across sessions.
---

# Kimi Supermemory

This skill enables persistent memory across Kimi CLI sessions using [Supermemory](https://supermemory.ai).

## Features

- **Automatic Context Recall**: On session start, relevant memories are fetched and injected
- **Memory Capture**: Important conversation turns are automatically saved
- **Memory Search**: Search your coding history across all sessions
- **Project-Aware**: Memories are organized by project/directory

## Setup

### 1. Install the MCP Server

```bash
# Clone the repository
git clone https://github.com/supermemoryai/kimi-supermemory.git
cd kimi-supermemory/mcp-server

# Install dependencies
npm install

# Build the server
npm run build
```

### 2. Configure kimi-cli MCP

Add the Supermemory MCP server to your kimi-cli configuration:

```bash
kimi mcp add --transport stdio supermemory -- node /path/to/kimi-supermemory/mcp-server/dist/server.cjs
```

### 3. Set API Key

Get your API key at [console.supermemory.ai](https://console.supermemory.ai) and set it:

```bash
export SUPERMEMORY_API_KEY="sm_..."
```

Or add to your `~/.bashrc` or `~/.zshrc` for persistence.

## How It Works

### On Session Start

When you start kimi-cli in a project directory, the skill automatically:

1. Fetches your user profile from Supermemory
2. Retrieves recent context for this project
3. Injects relevant memories into the conversation context

Example context that gets added:

```
<supermemory-context>
## User Profile
- Prefers TypeScript over JavaScript
- Uses Bun as package manager

## Recent Context (this project)
- Working on authentication flow
- Implemented JWT middleware last session
</supermemory-context>
```

### During Session

When you ask about past work or previous sessions, the skill automatically searches your memories.

### Memory Capture

Important conversation turns (code edits, decisions, summaries) are automatically captured and stored for future sessions.

## Manual Commands

You can also interact with memories manually:

### Search Memories

```
Search my memories for "authentication implementation"
```

### Add a Memory

```
Save to supermemory: "We decided to use PostgreSQL over MongoDB for transaction support"
```

### Index Codebase

```
Index this codebase into supermemory
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPERMEMORY_API_KEY` | Your Supermemory API key | Yes |
| `SUPERMEMORY_DEBUG` | Enable debug logging | No |

## Project Structure

Memories are organized by:
- **Container Tag**: Derived from project directory path (e.g., `myproject_abc123`)
- **Project Name**: Directory name
- **Global Profile**: Cross-project user preferences

## Troubleshooting

**No memories showing up?**
- Verify `SUPERMEMORY_API_KEY` is set correctly
- Check that MCP server is running: `kimi mcp list`
- Try indexing your codebase first

**MCP server not connecting?**
- Ensure the server is built: `npm run build` in mcp-server directory
- Check kimi-cli can find the server: `kimi mcp list`
