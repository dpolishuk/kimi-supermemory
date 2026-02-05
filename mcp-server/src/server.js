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
    const client = new SupermemoryClient(config.apiKey, config.apiUrl, args.containerTag);

    switch (name) {
      case 'supermemory_search': {
        const result = await client.search(args.query, args.containerTag, {
          limit: args.limit || 10,
        });
        
        if (result.results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No memories found for this query.',
              },
            ],
          };
        }

        const formatted = result.results
          .map((r, i) => `${i + 1}. ${r.memory.substring(0, 200)}${r.memory.length > 200 ? '...' : ''}`)
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${result.total} memories:\n\n${formatted}`,
            },
          ],
        };
      }

      case 'supermemory_add': {
        const result = await client.addMemory(
          args.content,
          args.containerTag,
          args.metadata
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
        const crypto = await import('crypto');
        const cwd = args.cwd || process.cwd();
        const hash = crypto.createHash('md5').update(cwd).digest('hex').slice(0, 8);
        const dirName = cwd.split('/').pop() || 'unknown';
        const containerTag = `${dirName}_${hash}`;
        const projectName = args.projectName || dirName;

        const profileResult = await client.getProfile(containerTag, projectName);
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
          .map((m, i) => `${i + 1}. ${(m.content || m.memory || '').substring(0, 150)}...`)
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
