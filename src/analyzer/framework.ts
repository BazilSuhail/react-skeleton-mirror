import { AnalysisResult } from '../types';

/**
 * Detects the framework being used based on file path patterns.
 */
export function detectFramework(
  filePath: string
): AnalysisResult['framework'] {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Next.js App Router: app/ directory with page.tsx or layout.tsx
  if (
    normalizedPath.includes('/app/') &&
    (normalizedPath.includes('/page.') || normalizedPath.includes('/layout.'))
  ) {
    return 'nextjs-app';
  }

  // Next.js Pages Router: pages/ directory
  if (normalizedPath.includes('/pages/')) {
    return 'nextjs-pages';
  }

  // Check for Next.js indicators in the file
  if (
    normalizedPath.includes('next/') ||
    normalizedPath.includes('next.config')
  ) {
    return 'nextjs-app';
  }

  return 'react';
}

/**
 * Checks if a file is likely a page or layout component (Next.js specific).
 */
export function isPageOrLayout(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return (
    normalizedPath.includes('/page.') ||
    normalizedPath.includes('/layout.') ||
    normalizedPath.includes('/loading.') ||
    normalizedPath.includes('/error.') ||
    normalizedPath.includes('/not-found.')
  );
}

/**
 * Checks if a file is a route handler (Next.js App Router API).
 */
export function isRouteHandler(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return (
    normalizedPath.includes('/route.') &&
    normalizedPath.includes('/app/')
  );
}
