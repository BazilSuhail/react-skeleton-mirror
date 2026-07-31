import { pathExists, readJson } from 'fs-extra';
import { resolve } from 'path';
import { SkeletonConfig } from '../types';
import { DEFAULT_CONFIG } from './defaults';

export async function loadConfig(): Promise<SkeletonConfig> {
  const configPath = resolve(process.cwd(), 'skeletonify.config.json');

  if (await pathExists(configPath)) {
    const userConfig = await readJson(configPath);
    return { ...DEFAULT_CONFIG, ...userConfig };
  }

  return DEFAULT_CONFIG;
}
