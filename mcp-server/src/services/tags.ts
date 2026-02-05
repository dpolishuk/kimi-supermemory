import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir as osHomedir } from "node:os";
import { createHash } from "node:crypto";

export function sha256(input: string): string {
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 17);
  return hash;
}

/**
 * Get user's email from git config
 * Returns null if git not configured
 */
export function getGitEmail(directory: string): string | null {
  try {
    const gitConfigPath = join(directory, ".git", "config");
    if (!existsSync(gitConfigPath)) {
      return null;
    }
    
    const gitConfig = readFileSync(gitConfigPath, "utf-8");
    const emailMatch = gitConfig.match(/\s*email\s*=\s*(.+)/);
    if (emailMatch && emailMatch[1]) {
      return emailMatch[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get user tag for cross-project memories
 * Format: {prefix}_user_{sha256(identifier)}
 */
export function getUserTag(prefix: string, _cwd?: string): string {
  const email = getGitEmail(_cwd || process.cwd());
  const identifier = email || process.env.KIMI_EMAIL || process.env.USER || process.env.USERNAME || "anonymous";
  return `${prefix}_user_${sha256(identifier)}`;
}

/**
 * Parse .git/config and extract remote URL
 * Returns null if not a git repository or remote not configured
 */
export function getGitRemoteUrl(directory: string): string | null {
  try {
    const gitConfigPath = join(directory, ".git", "config");
    if (!existsSync(gitConfigPath)) {
      return null;
    }
    
    const gitConfig = readFileSync(gitConfigPath, "utf-8");
    
    // Find URL from git config
    // Format: [remote "origin"]
    //         url = https://github.com/user/repo.git
    // OR: url = git@github.com:user/repo.git
    const urlMatch = gitConfig.match(/\s*url\s*=\s*(.+)/);
    if (!urlMatch) {
      return null;
    }
    
    return urlMatch[1].trim();
  } catch {
    return null;
  }
}

/**
 * Normalize git remote URL to canonical format
 * Handles SSH, HTTPS, and credential stripping
 */
export function normalizeGitUrl(url: string): string {
  let normalized = url.trim();
  
  // Remove protocol
  normalized = normalized.replace(/https?:\/\//, "");
  normalized = normalized.replace(/^git@/, "");
  normalized = normalized.replace(/:/g, "/");  // Convert colons to forward slashes for SSH
  
  // Remove credentials
  normalized = normalized.replace(/[^@]+@/, "");
  
  // Remove .git suffix
  normalized = normalized.replace(/\.git$/, "");
  
  // Normalize slashes
  normalized = normalized.replace(/\/+/g, "/");
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "");
  
  return normalized;
}

/**
 * Get project tag for project-specific memories
 * Format: {prefix}_project_{sha256(git_remote)}
 * Fallback to directory name if not a git repo
 */
export function getProjectTag(
  prefix: string,
  directory: string,
  getRemote?: (dir: string) => string | null
): string {
  const getRemoteFunction = getRemote || getGitRemoteUrl;
  const gitRemote = getRemoteFunction(directory);
  
  if (gitRemote) {
    const normalized = normalizeGitUrl(gitRemote);
    return `${prefix}_project_${sha256(normalized)}`;
  }
  
  // Fallback to directory name
  const dirName = directory.split("/").pop() || "unknown";
  return `${prefix}_project_${dirName}`;
}

/**
 * Get both user and project tags
 */
export function getTags(
  prefix: string,
  directory: string,
  getRemote?: (dir: string) => string | null
): { user: string; project: string } {
  return {
    user: getUserTag(prefix, directory),
    project: getProjectTag(prefix, directory, getRemote),
  };
}