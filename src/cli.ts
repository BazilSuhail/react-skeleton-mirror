#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(`\n❌ Unexpected error: ${message}\n`);
  process.exit(1);
});

const program = new Command();

program
  .name('skeletonify')
  .description('CLI tool that generates React skeleton components from your existing components')
  .version(version);

program
  .command('analyze')
  .description('Analyze React components and show skeleton generation suggestions')
  .argument('<path>', 'Path to component file or directory')
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (path: string, options: { verbose: boolean }) => {
    const { analyze } = await import('./commands/analyze');
    await analyze(path, options.verbose);
  });

program
  .command('generate')
  .description('Generate skeleton component files')
  .argument('<path>', 'Path to component file or directory')
  .option('-s, --style <style>', 'CSS output style: "css" or "tailwind"')
  .option('-o, --output <path>', 'Output directory for skeletons')
  .option('-t, --tests', 'Generate test files for skeletons', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (path: string, options: { style?: string; output?: string; tests: boolean; verbose: boolean }) => {
    const { generate } = await import('./commands/generate');
    await generate(path, {
      style: options.style as 'css' | 'tailwind' | undefined,
      output: options.output,
      tests: options.tests,
    }, options.verbose);
  });

program
  .command('watch')
  .description('Watch components and auto-regenerate skeletons on changes')
  .argument('<path>', 'Path to component file or directory to watch')
  .option('-s, --style <style>', 'CSS output style: "css" or "tailwind"')
  .option('-o, --output <path>', 'Output directory for skeletons')
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (path: string, options: { style?: string; output?: string; verbose: boolean }) => {
    const { watch } = await import('./commands/watch');
    await watch(path, {
      style: options.style as 'css' | 'tailwind' | undefined,
      output: options.output,
    }, options.verbose);
  });

program
  .command('init')
  .description('Create a skeletonify.config.json configuration file')
  .action(async () => {
    const { init } = await import('./commands/init');
    await init();
  });

async function main() {
  try {
    await program.parseAsync();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ ${message}\n`);
    process.exit(1);
  }
}

main();
