import { resolve } from 'path';
import { pathExists } from 'fs-extra';
import { parseComponent } from '../analyzer/parser';
import { createResolverContext } from '../analyzer/resolver';
import { GenerateOptions } from '../types';
import { loadConfig, resolveConfig, printConfig } from '../config';
import { getComponentFiles, writeSkeletonFiles } from '../utils/files';

export async function generate(
  targetPath: string,
  options: GenerateOptions,
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

  console.log(`\n✨ Generating skeletons...\n`);
  console.log(`  Style: ${config.style}`);
  console.log(`  Output: ${config.output}`);

  if (verbose) {
    printConfig(config);
  }
  console.log('');

  const ctx = createResolverContext();
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

      const result = await parseComponent(file, ctx);
      await writeSkeletonFiles(result, outputDir, config);

      generated++;
      const fileName = file.split(/[/\\]/).pop() || '';
      console.log(`  ✅ ${fileName} → ${result.componentName}.skeleton.tsx`);
      if (config.style === 'css') {
        console.log(`     ${result.componentName}.skeleton.css`);
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
