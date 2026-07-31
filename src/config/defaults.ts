import { SkeletonConfig } from '../types';

export const DEFAULT_CONFIG: SkeletonConfig = {
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

export const CONFIG_FILE_NAMES = [
  'skeletonify.config.json',
  'skeletonify.config.js',
  '.skeletonifyrc',
];
