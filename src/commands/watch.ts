import { resolve } from 'path';
import { pathExists, stat, mkdirp, writeFile, readdir } from 'fs-extra';
import chokidar from 'chokidar';
import { parseComponent } from '../analyzer/parser';
import { resetResolver } from '../analyzer/resolver';
import { generateSkeletonTSX } from '../generator/tsx';
import { generateCSS } from '../generator/templates';
import { WatchOptions, AnalysisResult } from '../types';
import { loadConfig, resolveConfig, printConfig } from '../config';

export async function watch(
  targetPath: string,
  options: WatchOptions,
  verbose: boolean = false
): Promise<void> {
  const resolvedPath = resolve(process.cwd(), targetPath);

  if (!(await pathExists(resolvedPath))) {
    console.log(`\n❌ Path not found: ${targetPath}\n`);
    process.exit(1);
  }

  // Load and resolve config
  const baseConfig = await loadConfig();
  const config = resolveConfig(baseConfig, options, verbose);
  const outputDir = resolve(process.cwd(), config.output);

  console.log(`\n👀 Watching for changes...\n`);
  console.log(`  Source: ${targetPath}`);
  console.log(`  Style: ${config.style}`);
  console.log(`  Output: ${config.output}`);

  if (verbose) {
    printConfig(config);
  }
  console.log('');

  // Determine watch pattern
  const isFile = (await stat(resolvedPath)).isFile();
  const watchPattern = isFile ? resolvedPath : `${resolvedPath.replace(/\\/g, '/')}/**/*.{tsx,jsx}`;

  // Track files being processed to avoid duplicate regeneration
  const processing = new Set<string>();

  const watcher = chokidar.watch(watchPattern, {
    ignoreInitial: true,
    ignored: [
      /(^|[\/\\])\../, // dot files
      /node_modules/,
      /\.skeleton\./,
      /\.test\./,
      /\.spec\./,
      /\.story\./,
      /\.stories\./,
    ],
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  // Handle file changes
  watcher.on('change', async (filePath: string) => {
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Skip if already processing
    if (processing.has(normalizedPath)) return;
    processing.add(normalizedPath);

    const fileName = normalizedPath.split('/').pop() || '';
    const componentName = fileName
      .replace(/\.(tsx|jsx)$/i, '')
      .split('.')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');

    console.log(`  📁 ${fileName} changed → Regenerating...`);

    try {
      if (verbose) {
        console.log(`     Parsing ${filePath}...`);
      }
      resetResolver();
      const result = await parseComponent(filePath);
      await writeSkeletonFiles(result, outputDir, config.style, config.animation);
      console.log(`  ✅ ${componentName}.skeleton.tsx updated`);
      if (config.style === 'css') {
        console.log(`     ${componentName}.skeleton.css updated`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  ⚠️  ${fileName} — error: ${message}`);
    } finally {
      processing.delete(normalizedPath);
    }
  });

  // Handle file additions
  watcher.on('add', async (filePath: string) => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (processing.has(normalizedPath)) return;
    processing.add(normalizedPath);

    const fileName = normalizedPath.split('/').pop() || '';

    console.log(`  📄 ${fileName} added → Generating skeleton...`);

    try {
      resetResolver();
      const result = await parseComponent(filePath);
      await writeSkeletonFiles(result, outputDir, config.style, config.animation);
      const componentName = fileName
        .replace(/\.(tsx|jsx)$/i, '')
        .split('.')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('');
      console.log(`  ✅ ${componentName}.skeleton.tsx created`);
      if (config.style === 'css') {
        console.log(`     ${componentName}.skeleton.css created`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  ⚠️  ${fileName} — error: ${message}`);
    } finally {
      processing.delete(normalizedPath);
    }
  });

  // Handle file deletions
  watcher.on('unlink', (filePath: string) => {
    const fileName = filePath.split(/[/\\]/).pop() || '';

    console.log(`  🗑️  ${fileName} removed → Skeleton not deleted (manual cleanup needed)`);
  });

  // Handle errors
  watcher.on('error', (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`\n  ❌ Watcher error: ${message}\n`);
  });

  // Initial generation
  console.log(`  🔍 Scanning for components...`);

  try {
    const files = await getComponentFiles(resolvedPath);
    let generated = 0;

    for (const file of files) {
      try {
        resetResolver();
        const result = await parseComponent(file);
        await writeSkeletonFiles(result, outputDir, config.style, config.animation);
        generated++;
      } catch {
        // Skip files that fail initial generation
      }
    }

    if (generated > 0) {
      console.log(`  ✅ Initial generation: ${generated} skeleton${generated !== 1 ? 's' : ''} created\n`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`  ⚠️  Initial scan error: ${message}\n`);
  }

  console.log(`  👀 Watching for changes... (Press Ctrl+C to stop)\n`);

  // Keep process alive
  await new Promise<void>((resolvePromise) => {
    process.on('SIGINT', () => {
      console.log('\n\n  👋 Stopping watcher...\n');
      watcher.close();
      resolvePromise();
    });
  });
}

async function writeSkeletonFiles(
  result: AnalysisResult,
  outputDir: string,
  style: 'css' | 'tailwind',
  animation: 'pulse' | 'shimmer' | 'none' = 'pulse'
): Promise<void> {
  await mkdirp(outputDir);

  const tsxContent = generateSkeletonTSX(result, style);
  const tsxPath = resolve(outputDir, `${result.componentName}.skeleton.tsx`);
  await writeFile(tsxPath, tsxContent, 'utf-8');

  if (style === 'css') {
    const cssContent = generateCSS(animation);
    const cssPath = resolve(outputDir, `${result.componentName}.skeleton.css`);
    await writeFile(cssPath, cssContent, 'utf-8');
  }
}

async function getComponentFiles(targetPath: string): Promise<string[]> {
  const s = await stat(targetPath);

  if (s.isFile()) {
    return [targetPath];
  }

  const files: string[] = [];
  await collectFiles(targetPath, files);

  return files.filter((f) => {
    const name = f.split(/[/\\]/).pop() || '';
    if (name.includes('.test.')) return false;
    if (name.includes('.spec.')) return false;
    if (name.includes('.story.')) return false;
    if (name.includes('.stories.')) return false;
    if (name.includes('.skeleton.')) return false;
    return true;
  });
}

async function collectFiles(dir: string, files: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      await collectFiles(fullPath, files);
    } else if (entry.isFile()) {
      const name = entry.name.toLowerCase();
      if (name.endsWith('.tsx') || name.endsWith('.jsx')) {
        files.push(fullPath);
      }
    }
  }
}
