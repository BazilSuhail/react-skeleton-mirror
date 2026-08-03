import { resolve } from 'path';
import { pathExists, stat } from 'fs-extra';
import chokidar from 'chokidar';
import { parseComponent } from '../analyzer/parser';
import { createResolverContext } from '../analyzer/resolver';
import { WatchOptions } from '../types';
import { loadConfig, resolveConfig, printConfig } from '../config';
import { getComponentFiles, writeSkeletonFiles } from '../utils/files';

export async function watch(
  targetPath: string,
  options: WatchOptions,
  verbose: boolean = false
): Promise<void> {
  const resolvedPath = resolve(process.cwd(), targetPath);

  if (!(await pathExists(resolvedPath))) {
    throw new Error(`Path not found: ${targetPath}`);
  }

  const baseConfig = await loadConfig();
  const config = resolveConfig(baseConfig, options, verbose);

  if (options.style && options.style !== 'css' && options.style !== 'tailwind') {
    throw new Error(`Invalid style: "${options.style}". Use "css" or "tailwind".`);
  }

  const outputDir = resolve(process.cwd(), config.output);

  console.log(`\n👀 Watching for changes...\n`);
  console.log(`  Source: ${targetPath}`);
  console.log(`  Style: ${config.style}`);
  console.log(`  Output: ${config.output}`);

  if (verbose) {
    printConfig(config);
  }
  console.log('');

  const isFile = (await stat(resolvedPath)).isFile();
  const watchPattern = isFile ? resolvedPath : `${resolvedPath.replace(/\\/g, '/')}/**/*.{tsx,jsx}`;

  const processing = new Set<string>();

  const watcher = chokidar.watch(watchPattern, {
    ignoreInitial: true,
    ignored: [
      /(^|[\/\\])\../,
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

  const onFileChange = async (filePath: string, action: 'change' | 'add') => {
    const normalizedPath = filePath.replace(/\\/g, '/');

    if (processing.has(normalizedPath)) return;
    processing.add(normalizedPath);

    const fileName = normalizedPath.split('/').pop() || '';
    const componentName = fileName
      .replace(/\.(tsx|jsx)$/i, '')
      .split('.')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');

    const actionLabel = action === 'change' ? 'changed → Regenerating' : 'added → Generating skeleton';
    console.log(`  📁 ${fileName} ${actionLabel}...`);

    try {
      if (verbose) {
        console.log(`     Parsing ${filePath}...`);
      }
      const ctx = createResolverContext();
      const result = await parseComponent(filePath, ctx);
      await writeSkeletonFiles(result, outputDir, config);
      const suffix = action === 'change' ? 'updated' : 'created';
      console.log(`  ✅ ${componentName}.skeleton.tsx ${suffix}`);
      if (config.style === 'css') {
        console.log(`     ${componentName}.skeleton.css ${suffix}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  ⚠️  ${fileName} — error: ${message}`);
    } finally {
      processing.delete(normalizedPath);
    }
  };

  watcher.on('change', (filePath: string) => onFileChange(filePath, 'change'));
  watcher.on('add', (filePath: string) => onFileChange(filePath, 'add'));

  watcher.on('unlink', (filePath: string) => {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    console.log(`  🗑️  ${fileName} removed → Skeleton not deleted (manual cleanup needed)`);
  });

  watcher.on('error', (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`\n  ❌ Watcher error: ${message}\n`);
  });

  console.log(`  🔍 Scanning for components...`);

  try {
    const files = await getComponentFiles(resolvedPath);
    let generated = 0;

    for (const file of files) {
      try {
        const ctx = createResolverContext();
        const result = await parseComponent(file, ctx);
        await writeSkeletonFiles(result, outputDir, config);
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

  const sigintHandler = () => {
    console.log('\n\n  👋 Stopping watcher...\n');
    watcher.close();
    process.removeListener('SIGINT', sigintHandler);
    resolveKeepAlive();
  };

  let resolveKeepAlive!: () => void;

  await new Promise<void>((resolvePromise) => {
    resolveKeepAlive = resolvePromise;
    process.on('SIGINT', sigintHandler);
  });
}
