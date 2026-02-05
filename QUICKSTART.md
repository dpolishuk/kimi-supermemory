# Kimi Supermemory – Quick Start in 30 seconds

## 1. Install

```bash
git clone https://github.com/dpolishuk/kimi-supermemory.git
cd kimi-supermemory
chmod +x install.sh && ./install.sh
```

## 2. Set API Key

Get your key at: https://console.supermemory.ai

**Check your shell:**
```bash
echo $SHELL
# /bin/bash or /bin/zsh
```

**For bash users:**
```bash
echo 'export SUPERMEMORY_API_KEY="sm_..."' >> ~/.bashrc
source ~/.bashrc
```

**For zsh users:**
```bash
echo 'export SUPERMEMORY_API_KEY="sm_..."' >> ~/.zshrc
source ~/.zshrc
```

**Verify it's set:**
```bash
echo $SUPERMEMORY_API_KEY
# Should show your key (starting with sm_)
```

**Test it works:**
```bash
curl -H "Authorization: Bearer $SUPERMEMORY_API_KEY" \
  https://api.supermemory.ai/profile
```

## 3. Verify Installation

```bash
kimi mcp list | grep supermemory
```

Should show the supermemory MCP server.

## 4. First Run

```bash
cd /path/to/your/project
kimi
```

The skill automatically loads relevant memories. Your decisions will be remembered across sessions.

---

## Getting Help

**Common issues:** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Logs:** `tail -f ~/.kimi-supermemory.log`

**Report bugs:** https://github.com/dpolishuk/kimi-supermemory/issues