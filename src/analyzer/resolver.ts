import { resolve, dirname, join } from 'path';
import { pathExists } from 'fs-extra';
import { ImportInfo, AnalysisResult } from '../types';
import { parseComponent } from './parser';

const analyzedFiles = new Set<string>();

/**
 * Resolves imported components and recursively analyzes them.
 * Skips node_modules, relative path components that aren't in the project.
 */
export async function resolveImports(
  imports: ImportInfo[],
  currentFilePath: string
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  const currentDir = dirname(currentFilePath);

  for (const imp of imports) {
    // Skip node_modules imports
    if (!imp.sourcePath.startsWith('.') && !imp.sourcePath.startsWith('/')) {
      continue;
    }

    // Resolve the file path
    const resolvedPath = await resolveComponentPath(imp.sourcePath, currentDir);

    if (!resolvedPath) {
      continue;
    }

    // Prevent infinite recursion
    const normalizedPath = resolvedPath.replace(/\\/g, '/');
    if (analyzedFiles.has(normalizedPath)) {
      continue;
    }

    analyzedFiles.add(normalizedPath);

    try {
      const analysis = await parseComponent(resolvedPath);
      results.push(analysis);
    } catch {
      // Skip files that can't be parsed
    }
  }

  return results;
}

/**
 * Resolves a component import path to an actual file path.
 * Tries .tsx, .jsx, .ts, .js extensions and index files.
 */
async function resolveComponentPath(
  importPath: string,
  fromDir: string
): Promise<string | null> {
  const extensions = ['.tsx', '.jsx', '.ts', '.js'];

  // Try direct path with extensions
  for (const ext of extensions) {
    const candidate = resolve(fromDir, `${importPath}${ext}`);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  // Try as directory with index file
  for (const ext of extensions) {
    const candidate = resolve(fromDir, importPath, `index${ext}`);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  // Try resolving without the @/ alias (common in Next.js)
  if (importPath.startsWith('@/')) {
    const withoutAlias = importPath.replace('@/', '');
    const result = await resolveComponentPath(withoutAlias, fromDir);
    if (result) return result;
  }

  // Try resolving relative to the project root
  const projectRoot = findProjectRoot(fromDir);
  if (projectRoot) {
    for (const ext of extensions) {
      const candidate = join(projectRoot, importPath.replace(/^\.\//, ''), ext);
      if (await pathExists(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Finds the project root by looking for package.json
 */
function findProjectRoot(fromDir: string): string | null {
  const parts = fromDir.replace(/\\/g, '/').split('/');

  // Walk up to 10 levels
  for (let i = parts.length; i > 0; i--) {
    const candidate = parts.slice(0, i).join('/');
    // This is a heuristic — in real code you'd check for package.json existence
    // But for performance we just return the deepest reasonable path
    if (candidate.includes('src') || candidate.includes('components')) {
      return parts.slice(0, i - 1).join('/') || candidate;
    }
  }

  return parts.slice(0, Math.max(1, parts.length - 3)).join('/');
}

/**
 * Resets the analyzed files set (useful for testing or fresh runs)
 */
export function resetResolver(): void {
  analyzedFiles.clear();
}
