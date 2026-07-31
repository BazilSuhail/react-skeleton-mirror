import { resolve } from 'path';
import { pathExists, stat, readdir } from 'fs-extra';
import { parseComponent } from '../analyzer/parser';
import { resetResolver } from '../analyzer/resolver';
import { loadConfig, resolveConfig, printConfig } from '../config';
import { AnalysisResult, SkeletonElement } from '../types';

export async function analyze(targetPath: string, verbose: boolean = false): Promise<void> {
  const resolvedPath = resolve(process.cwd(), targetPath);

  if (!(await pathExists(resolvedPath))) {
    console.log(`\n❌ Path not found: ${targetPath}\n`);
    process.exit(1);
  }

  // Load config for verbose output
  const baseConfig = await loadConfig();
  const config = resolveConfig(baseConfig, {}, verbose);

  console.log(`\n📊 Analyzing components...\n`);

  if (verbose) {
    printConfig(config);
    console.log('');
  }

  resetResolver();

  const files = await getComponentFiles(resolvedPath);

  if (files.length === 0) {
    console.log('  No components found.\n');
    return;
  }

  const results: AnalysisResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const result = await parseComponent(file);
      results.push(result);
      printComponentSummary(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const fileName = file.split(/[/\\]/).pop() || '';
      errors.push(`${fileName}: ${message}`);
      console.log(`  ⚠️  ${fileName} — parse error: ${message}`);
    }
  }

  if (results.length === 0) {
    if (errors.length > 0) {
      console.log(`\n  ❌ All ${errors.length} file(s) failed to parse.\n`);
    } else {
      console.log('  No components found.\n');
    }
    return;
  }

  printSuggestions(results);

  if (errors.length > 0) {
    console.log(`\n  ⚠️  ${errors.length} file(s) had parse errors.\n`);
  }
}

function printComponentSummary(result: AnalysisResult): void {
  const fileName = result.filePath.split(/[/\\]/).pop() || '';
  const elementCount = countElements(result.elements);
  const subCount = result.subComponents.length;

  const framework =
    result.framework === 'react'
      ? ''
      : result.framework === 'nextjs-app'
        ? ' [Next.js App]'
        : ' [Next.js Pages]';

  const client = result.isClientComponent ? ' [use client]' : '';

  console.log(
    `  ✅ ${fileName}${framework}${client} — ${elementCount} element${elementCount !== 1 ? 's' : ''}${
      subCount > 0 ? `, ${subCount} sub-component${subCount !== 1 ? 's' : ''}` : ''
    }`
  );
}

function countElements(elements: SkeletonElement[]): number {
  let count = elements.length;
  for (const el of elements) {
    count += countElements(el.children);
  }
  return count;
}

function printSuggestions(results: AnalysisResult[]): void {
  const suggestions: string[] = [];

  for (const result of results) {
    const fileName = result.filePath.split(/[/\\]/).pop() || '';
    const elementCount = countElements(result.elements);

    if (elementCount === 0) {
      suggestions.push(`  ⚠️  ${fileName} — no renderable elements found`);
      continue;
    }

    // Check for images
    const hasImages = hasElementType(result.elements, 'IMAGE') || hasElementType(result.elements, 'AVATAR');
    if (hasImages) {
      suggestions.push(`  💡 ${fileName} — has images, will generate circular/rectangular placeholders`);
    }

    // Check for text density
    const textCount = countElementType(result.elements, 'TEXT');
    if (textCount >= 3) {
      suggestions.push(`  💡 ${fileName} — has ${textCount} text elements, skeleton will have multiple text bars`);
    }

    // Check for containers
    const containerCount = countElementType(result.elements, 'CONTAINER');
    if (containerCount > 0) {
      suggestions.push(`  💡 ${fileName} — has ${containerCount} flex/grid container(s), layout will be preserved`);
    }

    // Check for buttons
    if (hasElementType(result.elements, 'BUTTON')) {
      suggestions.push(`  💡 ${fileName} — has button(s), will generate button-shaped placeholders`);
    }

    // Check for inputs
    if (hasElementType(result.elements, 'INPUT')) {
      suggestions.push(`  💡 ${fileName} — has input(s), will generate input-shaped placeholders`);
    }

    // Check for sub-components
    if (result.subComponents.length > 0) {
      const names = result.subComponents.map((s) => s.componentName).join(', ');
      suggestions.push(`  🔗 ${fileName} — sub-components: ${names}`);
    }
  }

  if (suggestions.length > 0) {
    console.log('\n📋 Suggestions:\n');
    for (const s of suggestions) {
      console.log(s);
    }
  }

  // Summary
  const totalElements = results.reduce((sum, r) => sum + countElements(r.elements), 0);
  const totalSubs = results.reduce((sum, r) => sum + r.subComponents.length, 0);

  console.log(`\n  📊 Summary: ${results.length} component${results.length !== 1 ? 's' : ''}, `);
  console.log(
    `     ${totalElements} element${totalElements !== 1 ? 's' : ''}, ` +
      `${totalSubs} sub-component${totalSubs !== 1 ? 's' : ''}\n`
  );
}

function hasElementType(elements: SkeletonElement[], type: string): boolean {
  for (const el of elements) {
    if (el.type === type) return true;
    if (hasElementType(el.children, type)) return true;
  }
  return false;
}

function countElementType(elements: SkeletonElement[], type: string): number {
  let count = 0;
  for (const el of elements) {
    if (el.type === type) count++;
    count += countElementType(el.children, type);
  }
  return count;
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
