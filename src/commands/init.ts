import { pathExists, writeJson } from 'fs-extra';
import { resolve } from 'path';
import { DEFAULT_CONFIG } from '../config/defaults';

export async function init(): Promise<void> {
  const configPath = resolve(process.cwd(), 'skeletonify.config.json');

  if (await pathExists(configPath)) {
    console.log('\n⚠️  skeletonify.config.json already exists. Skipping.\n');
    return;
  }

  await writeJson(configPath, DEFAULT_CONFIG, { spaces: 2 });

  console.log('\n✅ Created skeletonify.config.json\n');
  console.log('  Configuration options:');
  console.log('    style:      "css" or "tailwind"');
  console.log('    output:     Output directory for skeletons');
  console.log('    animation:  "pulse", "shimmer", or "none"');
  console.log('    colors:     Primary and secondary skeleton colors');
  console.log('    patterns:   Custom dimensions for avatar, button, text');
  console.log('\n  Edit skeletonify.config.json to customize.\n');
}
