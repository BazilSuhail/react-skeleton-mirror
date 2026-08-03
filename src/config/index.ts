import { pathExists, readJson } from 'fs-extra';
import { resolve } from 'path';
import { SkeletonConfig, ResolvedConfig, GenerateOptions, WatchOptions } from '../types';
import { DEFAULT_CONFIG, CONFIG_FILE_NAMES } from './defaults';

function deepMerge(target: SkeletonConfig, source: Partial<SkeletonConfig>): SkeletonConfig {
  const result: SkeletonConfig = { ...target };

  if (source.style !== undefined) result.style = source.style;
  if (source.output !== undefined) result.output = source.output;
  if (source.animation !== undefined) result.animation = source.animation;

  if (source.colors) {
    result.colors = {
      ...result.colors,
      ...source.colors,
    };
  }

  if (source.patterns) {
    result.patterns = {
      avatar: { ...result.patterns.avatar, ...source.patterns.avatar },
      button: { ...result.patterns.button, ...source.patterns.button },
      text: { ...result.patterns.text, ...source.patterns.text },
    };
  }

  return result;
}

export async function loadConfig(): Promise<SkeletonConfig> {
  const cwd = process.cwd();

  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = resolve(cwd, fileName);

    if (await pathExists(configPath)) {
      try {
        const userConfig = await readJson(configPath);
        const merged = deepMerge(DEFAULT_CONFIG, userConfig);
        const errors = validateConfig(merged);
        if (errors.length > 0) {
          console.warn(`  ⚠️  Config issues in ${fileName}:`);
          for (const err of errors) {
            console.warn(`     - ${err}`);
          }
        }
        return merged;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`  ⚠️  Failed to load ${fileName}: ${message}`);
      }
    }
  }

  return { ...DEFAULT_CONFIG };
}

export function resolveConfig(
  baseConfig: SkeletonConfig,
  cliOptions: Partial<GenerateOptions | WatchOptions>,
  verbose: boolean = false
): ResolvedConfig {
  let merged = { ...baseConfig };

  if (cliOptions.style) {
    merged.style = cliOptions.style;
  }
  if (cliOptions.output) {
    merged.output = cliOptions.output;
  }

  return {
    ...merged,
    verbose,
  };
}

export function validateConfig(config: Partial<SkeletonConfig>): string[] {
  const errors: string[] = [];

  if (config.style && config.style !== 'css' && config.style !== 'tailwind') {
    errors.push(`Invalid style: "${config.style}". Must be "css" or "tailwind".`);
  }

  if (config.animation && !['pulse', 'shimmer', 'none'].includes(config.animation)) {
    errors.push(`Invalid animation: "${config.animation}". Must be "pulse", "shimmer", or "none".`);
  }

  if (config.output && typeof config.output !== 'string') {
    errors.push('Output must be a string path.');
  }

  if (config.colors) {
    if (config.colors.primary && typeof config.colors.primary !== 'string') {
      errors.push('colors.primary must be a string (hex color).');
    }
    if (config.colors.secondary && typeof config.colors.secondary !== 'string') {
      errors.push('colors.secondary must be a string (hex color).');
    }
  }

  if (config.patterns) {
    if (config.patterns.avatar) {
      if (typeof config.patterns.avatar.width !== 'number') {
        errors.push('patterns.avatar.width must be a number.');
      }
      if (typeof config.patterns.avatar.height !== 'number') {
        errors.push('patterns.avatar.height must be a number.');
      }
    }
    if (config.patterns.button) {
      if (typeof config.patterns.button.height !== 'number') {
        errors.push('patterns.button.height must be a number.');
      }
    }
    if (config.patterns.text) {
      if (typeof config.patterns.text.height !== 'number') {
        errors.push('patterns.text.height must be a number.');
      }
    }
  }

  return errors;
}

export function printConfig(config: ResolvedConfig): void {
  console.log('  📋 Config:');
  console.log(`     style: ${config.style}`);
  console.log(`     output: ${config.output}`);
  console.log(`     animation: ${config.animation}`);
  console.log(`     colors: { primary: ${config.colors.primary}, secondary: ${config.colors.secondary} }`);
  console.log(`     verbose: ${config.verbose}`);
}
