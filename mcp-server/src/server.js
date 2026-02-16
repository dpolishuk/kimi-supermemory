#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SupermemoryClient } from './lib/supermemory-client.js';
import { formatContext } from './lib/format-context.js';
import { loadConfig as configLoader } from './services/config.js';
import { logInfo, logError, setDebugMode } from './services/logger.js';
import { stripPrivateContent, isFullyPrivate } from './services/privacy.js';
import { getTags, getUserTag, getProjectTag } from './services/tags.js';

const config = configLoader();
setDebugMode(config.debug);

logInfo('Kimi Supermemory MCP server starting');

async function getContainerTag(cwd) {
  // Create a stable container tag from the working directory
  const path = cwd || process.cwd();
  const crypto = await import('crypto');
  const hash = crypto.createHash('md5').update(path).digest('hex').slice(0, 8);
  const dirName = path.split('/').pop() || 'unknown';
  return `${dirName}_${hash}`;
}

const server = new Server(
  {
    name: 'kimi-supermemory',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'supermemory_search',
        description: 'Search your Supermemory for past coding sessions, decisions, and saved information. Use when the user asks about past work, previous sessions, or wants to recall information.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to find relevant memories',
            },
            containerTag: {
              type: 'string',
              description: 'Optional: project-specific container tag to search within',
            },
            types: {
              type: 'string',
              description: 'Optional: filter by memory types (project-config, architecture, error-solution, preference, learned-pattern, conversation)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'supermemory_add',
        description: 'Add a memory to Supermemory for future recall. Use to save important decisions, patterns, or context that should be remembered across sessions.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The memory content to save',
            },
            type: {
              type: 'string',
              description: 'Memory type (project-config, architecture, error-solution, preference, learned-pattern, conversation)',
              enum: ['project-config', 'architecture', 'error-solution', 'preference', 'learned-pattern', 'conversation'],
            },
            containerTag: {
              type: 'string',
              description: 'Optional: project-specific container tag',
            },
            metadata: {
              type: 'object',
              description: 'Optional: additional metadata for the memory',
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'supermemory_get_context',
        description: 'Get context and profile for the current session. Automatically called on session start to retrieve relevant memories.',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Current working directory',
            },
            projectName: {
              type: 'string',
              description: 'Optional: name of the project',
            },
          },
        },
      },
      {
        name: 'supermemory_list',
        description: 'List recent memories for a project.',
        inputSchema: {
          type: 'object',
          properties: {
            containerTag: {
              type: 'string',
              description: 'Optional: project-specific container tag',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of memories to list (default: 20)',
            },
          },
        },
      },
      {
        name: 'supermemory_forget',
        description: 'Delete a specific memory by ID. Use to remove incorrect or outdated memories.',
        inputSchema: {
          type: 'object',
          properties: {
            memoryId: {
              type: 'string',
              description: 'ID of the memory to delete',
            },
          },
          required: ['memoryId'],
        },
      },
      {
        name: 'supermemory_profile',
        description: 'Get user profile facts and information learned from interactions.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Optional query to filter profile facts',
            },
          },
        },
      },
      {
        name: 'supermemory',
        description: "Manage and query Supermemory persistent memory. Use 'add' to save memories, 'search' to find them, 'profile' to view your profile, 'list' to see recent memories, 'forget' to delete, or 'help' for usage guide. The 'scope' parameter controls whether memories are user-specific (cross-project) or project-specific.",
        inputSchema: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              enum: ['add', 'search', 'profile', 'list', 'forget', 'help'],
              description: 'Operation mode: add, search, profile, list, forget, or help',
            },
            content: {
              type: 'string',
              description: 'Memory content (required for add mode)',
            },
            query: {
              type: 'string',
              description: 'Search query (required for search mode, optional for profile)',
            },
            scope: {
              type: 'string',
              enum: ['user', 'project'],
              description: 'Memory scope: user (cross-project) or project (default)',
            },
            type: {
              type: 'string',
              enum: ['project-config', 'architecture', 'error-solution', 'preference', 'learned-pattern', 'conversation'],
              description: 'Memory type classification',
            },
            memoryId: {
              type: 'string',
              description: 'Memory ID (required for forget mode)',
            },
            limit: {
              type: 'number',
              description: 'Maximum results to return (for list/search modes)',
            },
          },
          required: ['mode'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!config.apiKey) {
    logError('SUPERMEMORY_API_KEY not set');
    return {
      content: [
        {
          type: 'text',
          text: 'Error: SUPERMEMORY_API_KEY environment variable is not set. Please set your API key from https://console.supermemory.ai',
        },
      ],
      isError: true,
    };
  }

  try {
    const client = new SupermemoryClient(config.apiKey, args.containerTag);

    switch (name) {
      case 'supermemory_search': {
        const result = await client.search(args.query, args.containerTag, {
          limit: args.limit || 10,
        });
        
        // Filter by type if specified
        let filteredResults = result.results;
        if (args.types) {
          const typeList = args.types.split(',').map(t => t.trim().toLowerCase());
          filteredResults = filteredResults.filter(r => {
            if (!r.metadata || !r.metadata.type) return false;
            return typeList.includes(r.metadata.type.toLowerCase());
          });
        }
        
        if (filteredResults.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No memories found for this query.',
              },
            ],
          };
        }

        const formatted = filteredResults
          .map((r, i) => {
            const typeName = r.metadata?.type ? ` [${r.metadata.type}]` : '';
            const similarityScore = r.similarity ? ` (${Math.round(r.similarity * 100)}% similarity)` : '';
            return `${i + 1}. ${stripPrivateContent(r.memory).substring(0, 200)}${stripPrivateContent(r.memory).length > 200 ? '...' : ''}${typeName}${similarityScore}`;
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${result.total} memories${args.types ? ' (filtered by types)' : ''}:\n\n${formatted}`,
            },
          ],
        };
      }

      case 'supermemory_add': {
        if (isFullyPrivate(args.content)) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: Cannot save memory. All content is marked as private using <private> tags. Memory must have non-private content to be saved.',
              },
            ],
            isError: true,
          };
        }
        
        const processedContent = stripPrivateContent(args.content);
        const metadataWithTimestamp = {
          ...args.metadata,
          ...(args.type && { type: args.type }),
          timestamp: new Date().toISOString(),
        };
        
        const result = await client.addMemory(
          processedContent,
          args.containerTag,
          metadataWithTimestamp
        );
        return {
          content: [
            {
              type: 'text',
              text: `Memory saved successfully (ID: ${result.id}).`,
            },
          ],
        };
      }

      case 'supermemory_get_context': {
        // Null-safe cwd handling: prevents crash when args.cwd is undefined
        const cwd = args?.cwd || process.cwd() || '/';
        const tags = getTags(cwd);
        const projectName = args?.projectName || cwd?.split('/').pop() || 'unknown';

        const profileResult = await client.getProfile(tags.project, projectName);
        const context = formatContext(profileResult, true, true, 5);

        if (!context) {
          return {
            content: [
              {
                type: 'text',
                text: '<supermemory-context>\nNo previous memories found for this project. Memories will be saved as you work.\n</supermemory-context>',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: context,
            },
          ],
        };
      }

      case 'supermemory_list': {
        const result = await client.listMemories(args.containerTag, args.limit || 20);
        
        if (!result.memories || result.memories.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No memories found.',
              },
            ],
          };
        }

        const formatted = result.memories
          .map((m, i) => `${i + 1}. ${stripPrivateContent(m.content || m.memory || '').substring(0, 150)}...`)
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Recent memories:\n\n${formatted}`,
            },
          ],
        };
      }

      case 'supermemory_forget': {
        await client.deleteMemory(args.memoryId);
        return {
          content: [
            {
              type: 'text',
              text: `Memory ${args.memoryId} deleted successfully.`,
            },
          ],
        };
      }

      case 'supermemory_profile': {
        const result = await client.getProfile(null, args.query);
        
        const staticFacts = result.profile?.static || [];
        const dynamicFacts = result.profile?.dynamic || [];
        
        if (staticFacts.length === 0 && dynamicFacts.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No profile information available. Interactions will build your profile over time.',
              },
            ],
          };
        }

        let profileText = '## Your Profile\n\n';
        
        if (staticFacts.length > 0) {
          profileText += '### Facts About You\n';
          staticFacts.forEach((fact, i) => {
            profileText += `${i + 1}. ${fact}\n`;
          });
          profileText += '\n';
        }
        
        if (dynamicFacts.length > 0) {
          profileText += '### What You\'ve Told Us\n';
          dynamicFacts.forEach((fact, i) => {
            profileText += `${i + 1}. ${fact}\n`;
          });
          profileText += '\n';
        }

        return {
          content: [
            {
              type: 'text',
              text: profileText,
            },
          ],
        };
      }

      case 'supermemory': {
        // Unified tool with mode parameter
        const mode = args.mode || 'help';
        const scope = args.scope || 'project';
        const cwd = args?.cwd || process.cwd() || '/';
        const tags = getTags(cwd);
        
        // Select container tag based on scope
        const containerTag = scope === 'user' ? tags.user : tags.project;

        try {
          switch (mode) {
            case 'help': {
              const helpText = `## Supermemory Usage Guide

### Commands
- **add** - Store a new memory
  Args: content (required), type?, scope?
  
- **search** - Search memories
  Args: query (required), scope?, limit?
  
- **profile** - View user profile
  Args: query?
  
- **list** - List recent memories
  Args: scope?, limit?
  
- **forget** - Remove a memory
  Args: memoryId (required)

### Scopes
- **user** - Cross-project preferences and knowledge
- **project** - Project-specific knowledge (default)

### Memory Types
- project-config, architecture, error-solution
- preference, learned-pattern, conversation

### Examples
Add project memory: { mode: "add", content: "Uses TypeScript", type: "project-config" }
Search all: { mode: "search", query: "authentication" }
List user memories: { mode: "list", scope: "user" }`;

              return {
                content: [{
                  type: 'text',
                  text: helpText,
                }],
              };
            }

            case 'add': {
              if (!args.content) {
                return {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      success: false,
                      error: 'content parameter is required for add mode'
                    }),
                  }],
                  isError: true,
                };
              }

              if (isFullyPrivate(args.content)) {
                return {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      success: false,
                      error: 'Cannot store fully private content'
                    }),
                  }],
                  isError: true,
                };
              }

              const processedContent = stripPrivateContent(args.content);
              const metadata = {
                ...(args.type && { type: args.type }),
                timestamp: new Date().toISOString(),
              };

              const result = await client.addMemory(processedContent, containerTag, metadata);
              
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    message: `Memory added to ${scope} scope`,
                    id: result.id,
                    scope,
                    type: args.type,
                  }),
                }],
              };
            }

            case 'search': {
              if (!args.query) {
                return {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      success: false,
                      error: 'query parameter is required for search mode'
                    }),
                  }],
                  isError: true,
                };
              }

              // If scope specified, search only that scope
              if (scope === 'user' || scope === 'project') {
                const searchTag = scope === 'user' ? tags.user : tags.project;
                const result = await client.search(args.query, searchTag, {
                  limit: args.limit || 10,
                });

                const combined = (result.results || []).map(r => ({
                  ...r,
                  scope,
                }));

                return {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      query: args.query,
                      scope,
                      count: combined.length,
                      results: combined.slice(0, args.limit || 10).map(r => ({
                        id: r.id,
                        content: r.memory || r.chunk,
                        similarity: Math.round(r.similarity * 100),
                        scope: r.scope,
                      })),
                    }),
                  }],
                };
              }

              // No scope specified - search both
              const [userResult, projectResult] = await Promise.all([
                client.search(args.query, tags.user, { limit: args.limit || 10 }),
                client.search(args.query, tags.project, { limit: args.limit || 10 }),
              ]);

              const combined = [
                ...(userResult.results || []).map(r => ({ ...r, scope: 'user' })),
                ...(projectResult.results || []).map(r => ({ ...r, scope: 'project' })),
              ].sort((a, b) => b.similarity - a.similarity);

              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    query: args.query,
                    count: combined.length,
                    results: combined.slice(0, args.limit || 10).map(r => ({
                      id: r.id,
                      content: r.memory || r.chunk,
                      similarity: Math.round(r.similarity * 100),
                      scope: r.scope,
                    })),
                  }),
                }],
              };
            }

            case 'list': {
              const result = await client.listMemories(containerTag, args.limit || 20);
              const memories = result.memories || [];

              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    scope,
                    count: memories.length,
                    memories: memories.map(m => ({
                      id: m.id,
                      content: m.summary || m.content,
                      createdAt: m.createdAt,
                      metadata: m.metadata,
                    })),
                  }),
                }],
              };
            }

            case 'forget': {
              if (!args.memoryId) {
                return {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      success: false,
                      error: 'memoryId parameter is required for forget mode'
                    }),
                  }],
                  isError: true,
                };
              }

              await client.deleteMemory(args.memoryId);

              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    message: `Memory ${args.memoryId} removed`,
                  }),
                }],
              };
            }

            case 'profile': {
              const result = await client.getProfile(tags.user, args.query);

              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    profile: {
                      static: result.profile?.static || [],
                      dynamic: result.profile?.dynamic || [],
                    },
                  }),
                }],
              };
            }

            default:
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    error: `Unknown mode: ${mode}`
                  }),
                }],
                isError: true,
              };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            }],
            isError: true,
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  logInfo('MCP server connecting to stdio transport');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Kimi Supermemory MCP server running on stdio');
  logInfo('MCP server ready and connected');
}

main().catch((error) => {
  logError('Fatal error during startup', String(error));
  console.error('Fatal error:', error);
  process.exit(1);
});
