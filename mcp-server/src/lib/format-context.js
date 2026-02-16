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
