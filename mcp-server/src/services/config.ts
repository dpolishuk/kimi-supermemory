import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { homedir as osHomedir } from "node:os";

const HOMEDIR = osHomedir();

export interface SupermemoryConfig {
  apiKey?: string;
  apiUrl?: string;
  similarityThreshold?: number;
  maxMemories?: number;
  maxProjectMemories?: number;
  maxProfileItems?: number;
  injectProfile?: boolean;
  containerTagPrefix?: string;
  keywordPatterns?: string[];
  debug?: boolean;
  allowPrivateContent?: boolean;
  filterPrompt?: string;
  shouldLLMFilter?: boolean;
}

const DEFAULT_FILTER_PROMPT = "You are a stateful coding agent. Remember all information relevant to the user's coding preferences, tech stack, behaviors, workflows, and project context.";

const DEFAULTS: Required<Omit<SupermemoryConfig, "apiKey" | "apiUrl" | "filterPrompt">> = {
  similarityThreshold: 0.6,
  maxMemories: 5,
  maxProjectMemories: 10,
  maxProfileItems: 5,
  injectProfile: true,
  containerTagPrefix: "kimi",
  keywordPatterns: [],
  debug: false,
  allowPrivateContent: false,
  shouldLLMFilter: true,
};

function getHomeConfigDir(): string {
  const xdgDir = join(HOMEDIR, ".config", "kimi");
  const legacyDir = join(HOMEDIR, ".kimi");
  
  if (existsSync(xdgDir)) return xdgDir;
  if (existsSync(legacyDir)) return legacyDir;
  return xdgDir;
}

export function loadConfig(): SupermemoryConfig {
  const configDir = getHomeConfigDir();
  const configFiles = [
    join(configDir, "supermemory.jsonc"),
    join(configDir, "supermemory.json"),
  ];
  
  const config: SupermemoryConfig = { ...DEFAULTS };
  let fileLoaded = false;
  
  for (const filePath of configFiles) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const jsonContent = content
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");
      const parsed = JSON.parse(jsonContent);
      Object.assign(config, parsed);
      fileLoaded = true;
      break;
    } catch {
      continue;
    }
  }
  
  if (!fileLoaded) {
    console.warn(`No config file found, using defaults`);
  }
  
  config.apiKey = process.env.SUPERMEMORY_API_KEY || config.apiKey;
  config.apiUrl = process.env.SUPERMEMORY_API_URL || config.apiUrl;
  config.filterPrompt = config.filterPrompt || DEFAULT_FILTER_PROMPT;
  config.shouldLLMFilter = config.shouldLLMFilter ?? DEFAULTS.shouldLLMFilter;
  
  return config;
}
