export function containsPrivateTag(content: string): boolean {
  return /<private>[\s\S]*?<\/private>/i.test(content);
}

/**
 * Strip <private> tags and their content
 * Replaced with [REDACTED]
 */
export function stripPrivateContent(content: string): string {
  return content.replace(/<private>[\s\S]*?<\/private>/gi, "[REDACTED]");
}

/**
 * Check if content is fully private (all content inside <private> tags)
 */
export function isFullyPrivate(content: string): boolean {
  const stripped = stripPrivateContent(content).trim();
  return stripped === "[REDACTED]" || stripped === "";
}

/**
 * Check if content has any non-private content
 */
export function hasNonPrivateContent(content: string): boolean {
  const stripped = stripPrivateContent(content).trim();
  return !isFullyPrivate(stripped) && stripped.replace(/\[REDACTED\]/g, "").trim().length > 0;
}