import { resolve, dirname } from 'path';
import { pathExists } from 'fs-extra';
import { ImportInfo, AnalysisResult } from '../types';
import { parseComponent } from './parser';

let globalAnalyzedFiles: Set<string> | null = null;

export async function resolveImports(
  imports: ImportInfo[],
  currentFilePath: string,
  analyzedFiles?: Set<string>
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  const currentDir = dirname(currentFilePath);
  const tracking = analyzedFiles || globalAnalyzedFiles || new Set<string>();

  for (const imp of imports) {
    if (!imp.sourcePath.startsWith('.') && !imp.sourcePath.startsWith('/')) {
      continue;
    }

    const resolvedPath = await resolveComponentPath(imp.sourcePath, currentDir);

    if (!resolvedPath) {
      continue;
    }

    const normalizedPath = resolvedPath.replace(/\\/g, '/');
    if (tracking.has(normalizedPath)) {
      continue;
    }

    tracking.add(normalizedPath);

    try {
      const analysis = await parseComponent(resolvedPath, tracking);
      results.push(analysis);
    } catch {
      // Skip files that can't be parsed
    }
  }

  return results;
}

export function createResolverContext(): Set<string> {
  return new Set<string>();
}

export function setGlobalResolverContext(ctx: Set<string>): void {
  globalAnalyzedFiles = ctx;
}

export function clearGlobalResolverContext(): void {
  globalAnalyzedFiles = null;
}

async function resolveComponentPath(
  importPath: string,
  fromDir: string
): Promise<string | null> {
  const extensions = ['.tsx', '.jsx', '.ts', '.js'];

  for (const ext of extensions) {
    const candidate = resolve(fromDir, `${importPath}${ext}`);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  for (const ext of extensions) {
    const candidate = resolve(fromDir, importPath, `index${ext}`);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  if (importPath.startsWith('@/')) {
    const withoutAlias = importPath.replace('@/', '');
    const result = await resolveComponentPath(withoutAlias, fromDir);
    if (result) return result;
  }

  const projectRoot = findProjectRoot(fromDir);
  if (projectRoot) {
    for (const ext of extensions) {
      const candidate = resolve(projectRoot, importPath.replace(/^\.\//, ''), ext);
      if (await pathExists(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function findProjectRoot(fromDir: string): string | null {
  const { sep } = require('path');
  const parts = fromDir.replace(/\\/g, '/').split('/');

  for (let i = parts.length; i > 0; i--) {
    const candidate = parts.slice(0, i).join('/');
    if (candidate.includes('src') || candidate.includes('components')) {
      return parts.slice(0, i - 1).join('/') || candidate;
    }
  }

  return parts.slice(0, Math.max(1, parts.length - 3)).join('/');
}
