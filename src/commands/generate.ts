import { resolve } from 'path';
import { pathExists, stat, mkdirp, writeFile, readdir } from 'fs-extra';
import { parseComponent } from '../analyzer/parser';
import { resetResolver } from '../analyzer/resolver';
import { generateSkeletonTSX } from '../generator/tsx';
import { generateCSS } from '../generator/templates';
import { GenerateOptions, AnalysisResult } from '../types';
import { loadConfig, resolveConfig, printConfig } from '../config';

export async function generate(
  targetPath: string,
  options: GenerateOptions,
  verbose: boolean = false
): Promise<void> {
  const resolvedPath = resolve(process.cwd(), targetPath);

  if (!(await pathExists(resolvedPath))) {
    console.log(`\n❌ Path not found: ${targetPath}\n`);
    process.exit(1);
  }

  // Load and resolve config (defaults → config file → CLI flags)
  const baseConfig = await loadConfig();
  const config = resolveConfig(baseConfig, options, verbose);

  // Validate style option
  if (options.style && options.style !== 'css' && options.style !== 'tailwind') {
    console.log(`\n❌ Invalid style: "${options.style}". Use "css" or "tailwind".\n`);
    process.exit(1);
  }

  const outputDir = resolve(process.cwd(), config.output);

  console.log(`\n✨ Generating skeletons...\n`);
  console.log(`  Style: ${config.style}`);
  console.log(`  Output: ${config.output}`);

  if (verbose) {
    printConfig(config);
  }
  console.log('');

  resetResolver();

  const files = await getComponentFiles(resolvedPath);

  if (files.length === 0) {
    console.log('  No components found.\n');
    return;
  }

  if (verbose) {
    console.log(`  📁 Found ${files.length} component(s)\n`);
  }

  let generated = 0;
  let failed = 0;

  for (const file of files) {
    try {
      if (verbose) {
        console.log(`  🔍 Parsing ${file.split(/[/\\]/).pop()}...`);
      }

      const result = await parseComponent(file);
      const success = await writeSkeletonFiles(result, outputDir, config.style);

      if (success) {
        generated++;
        const fileName = file.split(/[/\\]/).pop() || '';
        console.log(`  ✅ ${fileName} → ${result.componentName}.skeleton.tsx`);
        if (config.style === 'css') {
          console.log(`     ${result.componentName}.skeleton.css`);
        }
      }
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      const fileName = file.split(/[/\\]/).pop() || '';
      console.log(`  ⚠️  ${fileName} — error: ${message}`);
    }
  }

  if (generated === 0 && failed === 0) {
    console.log('  No skeletons generated.\n');
    return;
  }

  console.log(`\n  📊 Generated ${generated} skeleton${generated !== 1 ? 's' : ''}`);
  if (failed > 0) {
    console.log(`  ⚠️  ${failed} file(s) failed to generate`);
  }
  console.log('');
}

async function writeSkeletonFiles(
  result: AnalysisResult,
  outputDir: string,
  style: 'css' | 'tailwind'
): Promise<boolean> {
  // Create output directory if it doesn't exist
  await mkdirp(outputDir);

  // Generate TSX file
  const tsxContent = generateSkeletonTSX(result, style);
  const tsxPath = resolve(outputDir, `${result.componentName}.skeleton.tsx`);
  await writeFile(tsxPath, tsxContent, 'utf-8');

  // Generate CSS file (only in CSS mode)
  if (style === 'css') {
    const cssContent = generateCSS();
    const cssPath = resolve(outputDir, `${result.componentName}.skeleton.css`);
    await writeFile(cssPath, cssContent, 'utf-8');
  }

  return true;
}

async function getComponentFiles(targetPath: string): Promise<string[]> {
  const s = await stat(targetPath);

  if (s.isFile()) {
    if (isValidComponentFile(targetPath)) {
      return [targetPath];
    }
    console.log(`  ⚠️  ${targetPath.split(/[/\\]/).pop()} is not a .tsx or .jsx file\n`);
    return [];
  }

  // Directory — recursively find all .tsx, .jsx files
  const files: string[] = [];
  await collectFiles(targetPath, files);

  // Filter out test files, stories, and skeleton files
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

function isValidComponentFile(filePath: string): boolean {
  const name = filePath.split(/[/\\]/).pop()?.toLowerCase() || '';
  return name.endsWith('.tsx') || name.endsWith('.jsx');
}

async function collectFiles(dir: string, files: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
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
