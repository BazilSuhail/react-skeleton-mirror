import { WatchOptions } from '../types';

export async function watch(path: string, options: WatchOptions): Promise<void> {
  console.log(`\n👀 Watching: ${path}\n`);
  console.log(`  Style: ${options.style}`);
  console.log(`  Output: ${options.output}`);
  console.log('\n  ⏳ Watch mode not yet implemented...\n');
}
