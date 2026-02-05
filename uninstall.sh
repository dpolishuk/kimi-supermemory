#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${YELLOW}Uninstalling Kimi Supermemory...${NC}"

# Remove MCP server
if kimi mcp list 2>&1 | grep -q "supermemory"; then
  echo -e "${YELLOW}Removing MCP server...${NC}"
  kimi mcp remove supermemory
  echo -e "${GREEN}✓ MCP server removed${NC}"
else
  echo -e "${GREEN}✓ No MCP server found (already clean)${NC}"
fi

# Remove skill
SKILL_DIR="${HOME}/.config/agents/skills/kimi-supermemory"
if [ -d "$SKILL_DIR" ]; then
  echo -e "${YELLOW}Removing skill...${NC}"
  rm -rf "$SKILL_DIR"
  echo -e "${GREEN}✓ Skill removed${NC}"
else
  echo -e "${GREEN}✓ No skill found (already clean)${NC}"
fi

# Remove optional config files
if [ "$1" = "--clean-config" ]; then
  echo -e "${YELLOW}Removing configuration files...${NC}"

  if [ -f ~/.config/kimi/supermemory.jsonc ]; then
    rm -f ~/.config/kimi/supermemory.jsonc
    echo -e "${GREEN}✓ Removed config.jsonc${NC}"
  fi

  if [ -f ~/.config/kimi/supermemory.json ]; then
    rm -f ~/.config/kimi/supermemory.json
    echo -e "${GREEN}✓ Removed config.json${NC}"
  fi

  if [ -f ~/.kimi/supermemory.json ]; then
    rm -f ~/.kimi/supermemory.json
    echo -e "${GREEN}✓ Removed ~/.kimi/supermemory.json${NC}"
  fi

  if [ -f ~/.kimi-supermemory.log ]; then
    rm -f ~/.kimi-supermemory.log
    echo -e "${GREEN}✓ Removed logs${NC}"
  fi

  echo -e "${GREEN}✓ Configuration files removed${NC}"
fi

echo ""
echo -e "${GREEN}✓ Kimi Supermemory uninstalled${NC}"
echo ""
echo "Note: SUPERMEMORY_API_KEY environment variable was not removed."
echo "      To remove it, edit your ~/.bashrc or ~/.zshrc file."