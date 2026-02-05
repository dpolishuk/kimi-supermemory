export function formatContext(profileResult, isSessionStart = false, includeSearch = true, maxProfileItems = 5) {
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
