export interface SkeletonElement {
  type: SkeletonType;
  tagName: string;
  className?: string;
  style?: Record<string, string>;
  text?: string;
  width?: string;
  height?: string;
  isCircle?: boolean;
  children: SkeletonElement[];
}

export type SkeletonType =
  | 'IMAGE'
  | 'HEADING'
  | 'TEXT'
  | 'BUTTON'
  | 'INPUT'
  | 'LINK'
  | 'CONTAINER'
  | 'WRAPPER';

export interface AnalysisResult {
  filePath: string;
  componentName: string;
  isClientComponent: boolean;
  framework: 'react' | 'nextjs-app' | 'nextjs-pages';
  elements: SkeletonElement[];
  subComponents: AnalysisResult[];
}

export interface GenerateOptions {
  style: 'css' | 'tailwind';
  output: string;
  tests: boolean;
}

export interface WatchOptions {
  style: 'css' | 'tailwind';
  output: string;
}

export interface SkeletonConfig {
  style: 'css' | 'tailwind';
  output: string;
  animation: 'pulse' | 'shimmer' | 'none';
  colors: {
    primary: string;
    secondary: string;
  };
  patterns: {
    avatar: { width: number; height: number; circle: boolean };
    button: { height: number; borderRadius: number };
    text: { height: number; margin: string };
  };
}
