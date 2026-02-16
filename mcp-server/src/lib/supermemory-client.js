import Supermemory from 'supermemory';

const DEFAULT_PROJECT_ID = 'kimi_default';
const API_URL = process.env.SUPERMEMORY_API_URL || 'https://api.supermemory.ai';
const TIMEOUT_MS = 30000;

function withTimeout(promise, ms) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export class SupermemoryClient {
  constructor(apiKey, containerTag) {
    if (!apiKey) {
      throw new Error('SUPERMEMORY_API_KEY environment variable is required');
    }

    // Simple validation for API key format
    if (!apiKey.startsWith('sm_')) {
      throw new Error('Invalid API key format. Should start with "sm_"');
    }

    const tag = containerTag || DEFAULT_PROJECT_ID;

    this.client = new Supermemory({
      apiKey,
      baseURL: API_URL,
    });
    this.containerTag = tag;
  }

  async addMemory(content, containerTag, metadata = {}, customId = null) {
    const payload = {
      content,
      containerTag: containerTag || this.containerTag,
      metadata: { sm_source: 'kimi-cli-plugin', ...metadata },
    };
    if (customId) payload.customId = customId;
    const result = await withTimeout(this.client.add(payload), TIMEOUT_MS);
    return {
      id: result.id,
      status: result.status,
      containerTag: containerTag || this.containerTag,
    };
  }

  async search(query, containerTag, options = {}) {
    const result = await withTimeout(
      this.client.search.memories({
        q: query,
        containerTag: containerTag || this.containerTag,
        limit: options.limit || 10,
        searchMode: options.searchMode || 'hybrid',
      }),
      TIMEOUT_MS
    );
    return {
      results: result.results.map((r) => ({
        id: r.id,
        memory: r.content || r.memory || r.context || '',
        similarity: r.similarity,
        title: r.title,
        content: r.content,
      })),
      total: result.total,
      timing: result.timing,
    };
  }

  async getProfile(containerTag, query) {
    const result = await withTimeout(
      this.client.profile({
        containerTag: containerTag || this.containerTag,
        q: query,
      }),
      TIMEOUT_MS
    );
    return {
      profile: {
        static: result.profile?.static || [],
        dynamic: result.profile?.dynamic || [],
      },
      searchResults: result.searchResults
        ? {
            results: result.searchResults.results.map((r) => ({
              id: r.id,
              memory: r.content || r.context || '',
              similarity: r.similarity,
              title: r.title,
            })),
            total: result.searchResults.total,
            timing: result.searchResults.timing,
          }
        : undefined,
    };
  }

  async listMemories(containerTag, limit = 20) {
    // API expects containerTags as array, not string (fix for 400 error)
    const result = await withTimeout(
      this.client.memories.list({
        containerTags: [containerTag || this.containerTag],
        limit,
        order: 'desc',
        sort: 'createdAt',
      }),
      TIMEOUT_MS
    );
    return { memories: result.memories || result.results || [] };
  }

  async deleteMemory(memoryId) {
    return withTimeout(this.client.memories.delete(memoryId), TIMEOUT_MS);
  }
}
