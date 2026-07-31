import { GenerateOptions } from '../types';

export async function generate(path: string, options: GenerateOptions): Promise<void> {
  console.log(`\n✨ Generating skeletons for: ${path}\n`);
  console.log(`  Style: ${options.style}`);
  console.log(`  Output: ${options.output}`);
  console.log(`  Tests: ${options.tests ? 'yes' : 'no'}`);
  console.log('\n  ⏳ Generation not yet implemented...\n');
}
