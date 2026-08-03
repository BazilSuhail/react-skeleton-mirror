import { resolve } from 'path';
import { pathExists, stat, mkdirp, writeFile, readdir, readFile } from 'fs-extra';
import { AnalysisResult, SkeletonConfig } from '../types';
import { generateSkeletonTSX } from '../generator/tsx';
import { generateCSS } from '../generator/templates';

const COMPONENT_EXTENSIONS = new Set(['.tsx', '.jsx']);
const EXCLUDE_PATTERNS = [/\.test\./, /\.spec\./, /\.story\./, /\.stories\./, /\.skeleton\./];

export function isValidComponentFile(filePath: string): boolean {
  const name = filePath.split(/[/\\]/).pop()?.toLowerCase() || '';
  return COMPONENT_EXTENSIONS.has(name.slice(name.lastIndexOf('.')));
}

export async function collectFiles(dir: string, files: string[], visited?: Set<string>): Promise<void> {
  const realVisited = visited || new Set<string>();

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

      try {
        const realPath = await require('fs').realpathSync(fullPath);
        if (realVisited.has(realPath)) continue;
        realVisited.add(realPath);
      } catch {
        continue;
      }

      await collectFiles(fullPath, files, realVisited);
    } else if (entry.isFile()) {
      const name = entry.name.toLowerCase();
      if (COMPONENT_EXTENSIONS.has(name.slice(name.lastIndexOf('.')))) {
        files.push(fullPath);
      }
    }
  }
}

export async function getComponentFiles(targetPath: string): Promise<string[]> {
  const s = await stat(targetPath);

  if (s.isFile()) {
    if (isValidComponentFile(targetPath)) {
      return [targetPath];
    }
    console.log(`  ⚠️  ${targetPath.split(/[/\\]/).pop()} is not a .tsx or .jsx file\n`);
    return [];
  }

  const files: string[] = [];
  await collectFiles(targetPath, files);

  return files.filter((f) => {
    const name = f.split(/[/\\]/).pop() || '';
    return !EXCLUDE_PATTERNS.some((p) => p.test(name));
  });
}

export async function writeSkeletonFiles(
  result: AnalysisResult,
  outputDir: string,
  config: SkeletonConfig
): Promise<void> {
  await mkdirp(outputDir);

  const tsxContent = generateSkeletonTSX(result, config.style, config);
  const tsxPath = resolve(outputDir, `${result.componentName}.skeleton.tsx`);

  if (await pathExists(tsxPath)) {
    const existing = await readFile(tsxPath, 'utf-8');
    if (existing !== tsxContent) {
      await writeFile(tsxPath, tsxContent, 'utf-8');
    }
  } else {
    await writeFile(tsxPath, tsxContent, 'utf-8');
  }

  if (config.style === 'css') {
    const cssContent = generateCSS(config);
    const cssPath = resolve(outputDir, `${result.componentName}.skeleton.css`);

    if (await pathExists(cssPath)) {
      const existing = await readFile(cssPath, 'utf-8');
      if (existing !== cssContent) {
        await writeFile(cssPath, cssContent, 'utf-8');
      }
    } else {
      await writeFile(cssPath, cssContent, 'utf-8');
    }
  }
}
