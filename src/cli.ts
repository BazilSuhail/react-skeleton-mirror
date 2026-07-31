#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';

const program = new Command();

program
  .name('skeletonify')
  .description('CLI tool that generates React skeleton components from your existing components')
  .version(version);

program
  .command('analyze')
  .description('Analyze React components and show skeleton generation suggestions')
  .argument('<path>', 'Path to component file or directory')
  .action(async (path: string) => {
    const { analyze } = await import('./commands/analyze');
    await analyze(path);
  });

program
  .command('generate')
  .description('Generate skeleton component files')
  .argument('<path>', 'Path to component file or directory')
  .option('-s, --style <style>', 'CSS output style: "css" or "tailwind"', 'css')
  .option('-o, --output <path>', 'Output directory for skeletons', './src/skeletons')
  .option('-t, --tests', 'Generate test files for skeletons', false)
  .option('-w, --watch', 'Watch for changes and regenerate', false)
  .action(async (path: string, options: { style: string; output: string; tests: boolean; watch: boolean }) => {
    const { generate } = await import('./commands/generate');
    await generate(path, options as import('./types').GenerateOptions);
  });

program
  .command('watch')
  .description('Watch components and auto-regenerate skeletons on changes')
  .argument('<path>', 'Path to component file or directory to watch')
  .option('-s, --style <style>', 'CSS output style: "css" or "tailwind"', 'css')
  .option('-o, --output <path>', 'Output directory for skeletons', './src/skeletons')
  .action(async (path: string, options: { style: string; output: string }) => {
    const { watch } = await import('./commands/watch');
    await watch(path, options as import('./types').WatchOptions);
  });

program
  .command('init')
  .description('Create a skeletonify.config.json configuration file')
  .action(async () => {
    const { init } = await import('./commands/init');
    await init();
  });

program.parse();
