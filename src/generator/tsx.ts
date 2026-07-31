import { AnalysisResult } from '../types';
import { renderCSSElement, renderTailwindElement } from './templates';

/**
 * Generates a skeleton TSX component file from an analysis result.
 */
export function generateSkeletonTSX(
  result: AnalysisResult,
  style: 'css' | 'tailwind'
): string {
  const lines: string[] = [];

  // 'use client' directive if original had it
  if (result.isClientComponent) {
    lines.push("'use client';");
    lines.push('');
  }

  // CSS import (only in CSS mode)
  if (style === 'css') {
    const skeletonName = `${result.componentName}.skeleton`;
    lines.push(`import './${result.componentName}.skeleton.css';`);
    lines.push('');
  }

  // Props interface
  lines.push(`interface ${result.componentName}SkeletonProps {`);
  lines.push(`  className?: string;`);
  lines.push(`  style?: React.CSSProperties;`);
  lines.push(`}`);
  lines.push('');

  // Component
  lines.push(
    `export function ${result.componentName}Skeleton({ className, style }: ${result.componentName}SkeletonProps) {`
  );
  lines.push('  return (');

  // Render the element tree
  if (result.elements.length === 0) {
    lines.push('    <div className="skeleton" />');
  } else if (result.elements.length === 1) {
    const rendered =
      style === 'css'
        ? renderCSSElement(result.elements[0], 4)
        : renderTailwindElement(result.elements[0], 4);
    lines.push(rendered);
  } else {
    // Multiple root elements — wrap in a fragment
    lines.push('    <>');
    for (const element of result.elements) {
      const rendered =
        style === 'css'
          ? renderCSSElement(element, 5)
          : renderTailwindElement(element, 5);
      lines.push(rendered);
    }
    lines.push('    </>');
  }

  lines.push('  );');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
