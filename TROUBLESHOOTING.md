# Kimi Supermemory – Troubleshooting Guide

## 1. Installation fails with "EACCES: permission denied"

**Error:**
```
npm ERR! Error: EACCES: permission denied, access '/usr/local/lib/node_modules'
```

**Cause:** Trying to install in system directories without proper permissions.

**Solutions:**

**Option A: Use NVM (Recommended)**
```bash
# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or source profile
source ~/.bashrc

# Install Node.js
nvm install node
nvm use node

# Now run install.sh again
./install.sh
```

**Option B: Fix npm permissions**
```bash
# Change npm prefix to your home directory
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## 2. "kimi: command not found"

**Error:**
```
kimi: command not found
```

**Cause:** kimi CLI isn't installed or not in PATH.

**Solution:**
```bash
# Check if kimi exists
which kimi

# If not found, install kimi CLI
# Check installation instructions at:
# https://github.com/MoonshotAI/kimi-cli

# Verify installation
kimi --version
```

---

## 3. API key not recognized

**Issue:** Tool installed but memories aren't saved.

**Check API key is set:**
```bash
echo $SUPERMEMORY_API_KEY
```

**Should return something like:** `sm_abc123...`

**If empty, set it:**
```bash
# Add to ~/.bashrc
echo 'export SUPERMEMORY_API_KEY="sm_..."' >> ~/.bashrc

# OR for current session only
export SUPERMEMORY_API_KEY="sm_..."

# Reload shell
source ~/.bashrc
```

**Verify key format:**
```bash
echo $SUPERMEMORY_API_KEY | grep "^sm_"
```

---

## 4. MCP server not loading

**Check if registered:**
```bash
kimi mcp list | grep supermemory
```

**If not found:**
```bash
cd kimi-supermemory
./install.sh
```

**If registered but fails to load:**
```bash
# Check MCP config file
cat ~/.kimi/mcp.json

# Look for supermemory entry
```

**Test server directly:**
```bash
node /path/to/mcp-server/dist/server.cjs 2>&1 | head -5
```

---

## 5. "npm install" hangs or fails

**Possible causes:**

**Network issues:**
```bash
# Check internet connectivity
curl -I https://registry.npmjs.org

# Try using npm registry mirror
npm config set registry https://registry.npm.taobao.org
./install.sh
```

**Registry cache corruption:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
cd mcp-server && npm install
```

**Disk space:**
```bash
# Check available space
df -h ~

# Clean up if needed
rm -rf ~/.npm/*
```

---

## 6. Skill not appearing in kimi CLI

**Check skill installation:**
```bash
ls -la ~/.config/agents/skills/kimi-supermemory/
```

**Should show:** `SKILL.md`

**If missing:**
```bash
mkdir -p ~/.config/agents/skills/kimi-supermemory
cp skill/SKILL.md ~/.config/agents/skills/kimi-supermemory/
```

---

## 7. Verify installation works

Test basic functionality:

```bash
# 1. Check MCP server status
kimi mcp list

# 2. Check skill exists
ls ~/.config/agents/skills/kimi-supermemory/SKILL.md

# 3. Test API key
curl -H "Authorization: Bearer $SUPERMEMORY_API_KEY" \
  https://api.supermemory.ai/profile

# 4. Run install test
cd mcp-server
npm test
```

All should pass/succeed.

---

## 8. Still stuck?

**Enable debug logging:**

```bash
# Set debug mode
export SUPERMEMORY_DEBUG=true

# Check logs
tail -f ~/.kimi-supermemory.log
```

**Open an issue:**
https://github.com/dpolishuk/kimi-supermemory/issues

Include:
- Error message
- OS version
- Node version: `node --version`
- kimi CLI version: `kimi --version`
- Debug log (from ~/.kimi-supermemory.log)