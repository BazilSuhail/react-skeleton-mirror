import { pathExists, writeJson } from 'fs-extra';
import { resolve } from 'path';

const DEFAULT_CONFIG = {
  style: 'css',
  output: './src/skeletons',
  animation: 'pulse',
  colors: {
    primary: '#e5e7eb',
    secondary: '#d1d5db',
  },
  patterns: {
    avatar: { width: 48, height: 48, circle: true },
    button: { height: 40, borderRadius: 6 },
    text: { height: 16, margin: '8px 0' },
  },
};

export async function init(): Promise<void> {
  const configPath = resolve(process.cwd(), 'skeletonify.config.json');

  if (await pathExists(configPath)) {
    console.log('\n⚠️  skeletonify.config.json already exists. Skipping.\n');
    return;
  }

  await writeJson(configPath, DEFAULT_CONFIG, { spaces: 2 });
  console.log('\n✅ Created skeletonify.config.json\n');
}
