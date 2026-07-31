import { pathExists, readJson } from 'fs-extra';
import { resolve } from 'path';
import { SkeletonConfig, ResolvedConfig, GenerateOptions, WatchOptions } from '../types';
import { DEFAULT_CONFIG, CONFIG_FILE_NAMES } from './defaults';

/**
 * Deep merge two objects. Source values override target values.
 * Only merges plain objects; other values are overwritten.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result;
}

/**
 * Loads the skeletonify config file from the project root.
 * Tries multiple config file names in order.
 */
export async function loadConfig(): Promise<SkeletonConfig> {
  const cwd = process.cwd();

  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = resolve(cwd, fileName);

    if (await pathExists(configPath)) {
      try {
        const userConfig = await readJson(configPath);
        return deepMerge(DEFAULT_CONFIG, userConfig);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`  ⚠️  Failed to load ${fileName}: ${message}`);
      }
    }
  }

  return { ...DEFAULT_CONFIG };
}

/**
 * Resolves the final config by merging:
 * 1. Default config
 * 2. User config file
 * 3. CLI flags (highest priority)
 */
export function resolveConfig(
  baseConfig: SkeletonConfig,
  cliOptions: Partial<GenerateOptions | WatchOptions>,
  verbose: boolean = false
): ResolvedConfig {
  let merged = { ...baseConfig };

  // CLI flags override config file values
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

/**
 * Validates a config object and returns any errors found.
 */
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

/**
 * Prints the resolved config in verbose mode.
 */
export function printConfig(config: ResolvedConfig): void {
  console.log('  📋 Config:');
  console.log(`     style: ${config.style}`);
  console.log(`     output: ${config.output}`);
  console.log(`     animation: ${config.animation}`);
  console.log(`     colors: { primary: ${config.colors.primary}, secondary: ${config.colors.secondary} }`);
  console.log(`     verbose: ${config.verbose}`);
}
