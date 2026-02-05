# 🧠 Kimi Supermemory

Persistent memory for [Kimi CLI](https://github.com/MoonshotAI/kimi-cli) using [Supermemory](https://supermemory.ai).

> **✨ Requires [Supermemory Pro or above](https://console.supermemory.ai/billing)**

Your Kimi CLI agent remembers what you worked on - across sessions, across projects.

---

## ✨ Features

- **🧠 Context Recall**: Automatically fetches relevant memories on session start
- **💾 Memory Capture**: Saves important conversation turns for future context
- **🔍 Memory Search**: Search your coding history across all sessions
- **📁 Project-Aware**: Memories organized by project/directory
- **🔄 Cross-Session**: Continue where you left off, even days later

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [kimi-cli](https://github.com/MoonshotAI/kimi-cli) installed
- Supermemory API key (get at [console.supermemory.ai](https://console.supermemory.ai))

### One-Line Installation

```bash
git clone https://github.com/dpolishuk/kimi-supermemory.git
cd kimi-supermemory
chmod +x install.sh
./install.sh
```

### Set Your API Key

```bash
export SUPERMEMORY_API_KEY="sm_..."
```

Add to your `~/.bashrc` or `~/.zshrc` to make it permanent.

---

## 📖 How It Works

### On Session Start

When you start kimi-cli in a project, the skill automatically:

1. Generates a unique container tag from your project path
2. Fetches your user profile and recent context from Supermemory
3. Injects relevant memories into the conversation

Example context that gets added:

```
<supermemory-context>
The following is recalled context about the user and project:

## User Profile (Persistent)
- Prefers TypeScript over JavaScript
- Uses Bun as package manager

## Recent Context
- Working on authentication flow
- Implemented JWT middleware last session
</supermemory-context>
```

### During Session

When you ask about past work, the AI automatically searches your memories:

**You**: "What did I work on yesterday?"

**AI**: *Uses `supermemory_search` to find relevant memories*

### Manual Commands

You can also interact directly with memories:

| Command | Description |
|---------|-------------|
| "Search my memories for..." | Search past sessions |
| "Save to supermemory: ..." | Add a new memory |
| "Show my recent memories" | List recent memories |
| "Index this codebase into supermemory" | Index project files |

---

## 🛠️ Available MCP Tools

The MCP server exposes these tools:

| Tool | Description |
|------|-------------|
| `supermemory_search` | Search memories by query |
| `supermemory_add` | Add a new memory |
| `supermemory_get_context` | Get profile + context for session |
| `supermemory_list` | List recent memories |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Kimi CLI      │────▶│  MCP Server      │────▶│  Supermemory    │
│                 │     │  (stdio)         │     │  API            │
│  ┌───────────┐  │     │                  │     │                 │
│  │  Skill    │  │◀────│  Exposes:        │◀────│                 │
│  │  (guidance)│  │     │  - search        │     │                 │
│  └───────────┘  │     │  - add           │     │                 │
│                 │     │  - get_context   │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

Kimi CLI uses a **Skill + MCP** architecture:

- **Skill** (`SKILL.md`): Guides the AI when to use memory features
- **MCP Server**: Handles actual Supermemory API calls via stdio

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPERMEMORY_API_KEY` | Yes | Your Supermemory API key |
| `SUPERMEMORY_API_URL` | No | Custom API endpoint (default: https://api.supermemory.ai) |

### Project Organization

Memories are organized by:
- **Container Tag**: `{dirname}_{hash}` (e.g., `myproject_a1b2c3d4`)
- **Project Name**: Directory name
- **Global Profile**: Cross-project user preferences

---

## 🧪 Development

### Build from Source

```bash
# Install dependencies
npm install

# Build the MCP server
cd mcp-server
npm install
npm run build
```

### Manual Setup (without install.sh)

```bash
# 1. Build the MCP server
cd mcp-server
npm install
npm run build

# 2. Add to kimi-cli MCP servers
kimi mcp add --transport stdio supermemory -- node /path/to/mcp-server/dist/server.cjs

# 3. Install the skill
mkdir -p ~/.config/agents/skills/kimi-supermemory
cp skill/SKILL.md ~/.config/agents/skills/kimi-supermemory/
```

---

## 🐛 Troubleshooting

### MCP server not found

```bash
kimi mcp list  # Should show 'supermemory'
```

If missing, re-add:
```bash
kimi mcp add --transport stdio supermemory -- node /full/path/to/mcp-server/dist/server.cjs
```

### No memories showing up

- Verify `SUPERMEMORY_API_KEY` is set: `echo $SUPERMEMORY_API_KEY`
- Check API key format (should start with `sm_`)
- Verify MCP server is responding: `kimi mcp list`

### Debug mode

Set `SUPERMEMORY_DEBUG=true` to see detailed logs.

---

## 📦 Project Structure

```
kimi-supermemory/
├── skill/
│   └── SKILL.md              # Kimi skill definition
├── mcp-server/
│   ├── src/
│   │   ├── server.js         # Main MCP server
│   │   └── lib/
│   │       ├── supermemory-client.js
│   │       └── format-context.js
│   ├── dist/
│   │   └── server.cjs        # Built server (generated)
│   └── package.json
├── install.sh                # One-command installer
├── package.json              # Root package.json
└── README.md                 # This file
```

---

## 🤝 Related Projects

- [Claude Supermemory](https://github.com/supermemoryai/claude-supermemory) - The original Claude Code plugin
- [Supermemory](https://supermemory.ai) - The memory API service
- [Kimi CLI](https://github.com/MoonshotAI/kimi-cli) - The AI coding agent

---

## 📄 License

MIT

---

Made with ❤️ by dpolishuk! ;-P
