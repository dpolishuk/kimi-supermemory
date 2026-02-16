export function formatContext(profileResult, projectMemories = null, userMemories = null, maxProfileItems = 5) {
  if (!profileResult && !projectMemories && !userMemories) return null;

  const sections = [];
  const header = '[SUPERMEMORY]';

  // Add User Profile section if we have profile data
  if (profileResult?.profile) {
    const { static: staticFacts, dynamic: dynamicFacts } = profileResult.profile;
    const profileItems = [
      ...(staticFacts || []),
      ...(dynamicFacts || []),
    ].slice(0, maxProfileItems);

    if (profileItems.length > 0) {
      sections.push('User Profile:');
      for (const item of profileItems) {
        const content = item.content || item;
        if (content) {
          sections.push(`- ${content}`);
        }
      }
    }
  }

  // Add Project Knowledge section (from listMemories - 100% similarity)
  if (projectMemories?.results?.length > 0) {
    const projectResults = projectMemories.results
      .filter((r) => r.memory || r.chunk || r.content)
      .slice(0, 10);

    if (projectResults.length > 0) {
      sections.push('Project Knowledge:');
      for (const item of projectResults) {
        const memory = (item.memory || item.chunk || item.content || '').trim();
        if (memory) {
          sections.push(`- [100%] ${memory}`);
        }
      }
    }
  }

  // Add Relevant Memories section (from search - actual similarity)
  if (userMemories?.results?.length > 0) {
    const userResults = userMemories.results
      .filter((r) => r.memory || r.chunk || r.content)
      .slice(0, 5);

    if (userResults.length > 0) {
      sections.push('Relevant Memories:');
      for (const item of userResults) {
        const similarity = Math.round((item.similarity || 0) * 100);
        const memory = (item.memory || item.chunk || item.content || '').trim();
        if (memory) {
          sections.push(`- [${similarity}%] ${memory}`);
        }
      }
    }
  }

  if (sections.length === 0) return null;

  return `${header}\n\n${sections.join('\n')}`;
}

// Legacy format function for backward compatibility
export function formatContextLegacy(profileResult, isSessionStart = false, includeSearch = true, maxProfileItems = 5) {
  if (!profileResult) return null;

  const sections = [];
  const { profile, searchResults } = profileResult;

  // Add profile section if we have profile data
  if (profile && (profile.static?.length > 0 || profile.dynamic?.length > 0)) {
    const profileItems = [
      ...(profile.static || []),
      ...(profile.dynamic || []),
    ].slice(0, maxProfileItems);

    if (profileItems.length > 0) {
      sections.push('## User Profile (Persistent)');
      for (const item of profileItems) {
        if (item.content) {
          sections.push(`- ${item.content}`);
        }
      }
    }
  }

  // Add recent context from search results
  if (includeSearch && searchResults?.results?.length > 0) {
    const contextItems = searchResults.results
      .filter((r) => r.memory && r.memory.trim())
      .slice(0, 5);

    if (contextItems.length > 0) {
      sections.push('## Recent Context');
      for (const item of contextItems) {
        const memory = item.memory.trim();
        // Truncate long memories
        const truncated = memory.length > 300 
          ? memory.slice(0, 300) + '...' 
          : memory;
        sections.push(`- ${truncated}`);
      }
    }
  }

  if (sections.length === 0) return null;

  return `<supermemory-context>\nThe following is recalled context about the user and project:\n\n${sections.join('\n')}\n</supermemory-context>`;
}
