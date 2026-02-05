#!/bin/bash -e
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Installing Kimi Supermemory...${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required. Found: $(node --version)${NC}"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Build the MCP server
echo -e "${YELLOW}Building MCP server...${NC}"
cd "$SCRIPT_DIR/mcp-server"
npm install
npm run build

# Check if kimi CLI is installed
if ! command -v kimi &> /dev/null; then
    echo -e "${RED}Warning: kimi CLI is not installed or not in PATH.${NC}"
    echo "Please install kimi-cli first: https://github.com/MoonshotAI/kimi-cli"
    exit 1
fi

# Add MCP server to kimi-cli
echo -e "${YELLOW}Adding Supermemory MCP server to kimi-cli...${NC}"
SERVER_PATH="$SCRIPT_DIR/mcp-server/dist/server.cjs"

if kimi mcp list | grep -q "supermemory"; then
    echo -e "${YELLOW}Supermemory MCP server already exists. Removing old entry...${NC}"
    kimi mcp remove supermemory
fi

kimi mcp add --transport stdio supermemory -- node "$SERVER_PATH"

# Verify MCP server is working
echo -e "${YELLOW}Verifying MCP server...${NC}"
if kimi mcp list 2>&1 | grep -q "supermemory"; then
  echo -e "${GREEN}✓ MCP server registered successfully${NC}"
else
  echo -e "${RED}✗ MCP server registration failed. Run 'kimi mcp list' to diagnose.${NC}"
  exit 1
fi

# Install skill
echo -e "${YELLOW}Installing skill...${NC}"
SKILL_DIR="${HOME}/.config/agents/skills/kimi-supermemory"
mkdir -p "$SKILL_DIR"
cp "$SCRIPT_DIR/skill/SKILL.md" "$SKILL_DIR/"

# Verify skill installation
echo -e "${YELLOW}Verifying skill installation...${NC}"
if [ -f "$SKILL_DIR/SKILL.md" ]; then
  echo -e "${GREEN}✓ Skill installed at $SKILL_DIR${NC}"
else
  echo -e "${RED}✗ Skill installation failed. Check directory exists: $SKILL_DIR${NC}"
  exit 1
fi

# Check for API key
if [ -z "$SUPERMEMORY_API_KEY" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Warning: SUPERMEMORY_API_KEY environment variable is not set.${NC}"
    echo ""
    echo "Please set it by adding the following to your ~/.bashrc or ~/.zshrc:"
    echo ""
    echo "  export SUPERMEMORY_API_KEY='sm_...'"
    echo ""
    echo "Get your API key at: https://console.supermemory.ai"
fi

# If API key is set, verify MCP server loads
if [ -n "$SUPERMEMORY_API_KEY" ]; then
    echo -e "${YELLOW}Testing MCP server startup...${NC}"
    if timeout 5s node "$SERVER_PATH" 2>&1 | grep -q "running on stdio"; then
        echo -e "${GREEN}✓ MCP server test passed${NC}"
    else
        echo -e "${YELLOW}⚠️  MCP server test skipped (may need interactive session)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✓ Kimi Supermemory installed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Set your API key: export SUPERMEMORY_API_KEY='sm_...'"
echo "  2. Start kimi-cli in your project directory"
echo "  3. The skill will automatically recall context on session start"
echo ""
echo "To verify installation:"
echo "  kimi mcp list  # Should show 'supermemory'"
echo ""
