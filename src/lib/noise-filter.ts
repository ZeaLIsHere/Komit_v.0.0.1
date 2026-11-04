/**
 * Noise filter logic based on Section 4 of ARCHITECTURE.md.
 * Filtered commits remain saved in database with isFiltered = true,
 * but are excluded from activity metrics.
 */

export const BUILT_IN_NOISE_PATTERNS = {
  files: [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "composer.lock",
    "Gemfile.lock",
    "Cargo.lock",
    "go.sum",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/vendor/**",
    "**/*.min.js",
    "**/*.min.css",
    "**/*.map",
    "**/*.generated.*",
  ],
  messages: [
    /^Merge (branch|pull request|remote)/i,
    /^Initial commit$/i,
    /^\[bot\]/i,
    /^Auto-generated/i,
  ],
};

/**
 * Converts a simple glob string to a regular expression.
 */
function globToRegex(glob: string): RegExp {
  const normalized = glob.replace(/\\/g, "/");
  const regexStr = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex special chars except * and ?
    .replace(/\*\*/g, ".*")
    .replace(/(?<!\.)\*/g, "[^/]*")
    .replace(/\?/g, ".");
  return new RegExp(`^${regexStr}$`, "i");
}

/**
 * Checks if a given file path matches any pattern in the list.
 */
export function matchesPattern(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\//, "");

  for (const pattern of patterns) {
    const trimmed = pattern.trim();
    if (!trimmed) continue;

    // Direct filename check
    if (!trimmed.includes("/") && !trimmed.includes("*")) {
      const fileName = normalizedPath.split("/").pop() || "";
      if (fileName.toLowerCase() === trimmed.toLowerCase()) {
        return true;
      }
    }

    try {
      const regex = globToRegex(trimmed);
      if (regex.test(normalizedPath) || regex.test(normalizedPath.split("/").pop() || "")) {
        return true;
      }
    } catch {
      // Fallback substring check if glob regex fails
      if (normalizedPath.includes(trimmed)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Evaluates whether a commit event is noise.
 *
 * Rules:
 * 1. If commit message matches NOISE_PATTERNS.messages -> true
 * 2. If files list is provided:
 *    - If ALL files match built-in + course exclude patterns -> true
 *    - If at least one file is meaningful -> false
 * 3. If isWhitespaceOnly is true -> true
 */
export function isNoiseCommit(params: {
  message?: string | null;
  files?: string[];
  excludePatterns?: string[];
  isWhitespaceOnly?: boolean;
}): boolean {
  const { message, files, excludePatterns = [], isWhitespaceOnly = false } = params;

  if (isWhitespaceOnly) {
    return true;
  }

  // Check commit message
  if (message) {
    const trimmedMsg = message.trim();
    for (const msgRegex of BUILT_IN_NOISE_PATTERNS.messages) {
      if (msgRegex.test(trimmedMsg)) {
        return true;
      }
    }
  }

  // Check changed files
  if (files && files.length > 0) {
    const allPatterns = [...BUILT_IN_NOISE_PATTERNS.files, ...excludePatterns];
    const allFilesAreNoise = files.every((file) => matchesPattern(file, allPatterns));

    if (allFilesAreNoise) {
      return true;
    }
  }

  return false;
}

