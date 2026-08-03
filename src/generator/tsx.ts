import { AnalysisResult, SkeletonConfig } from '../types';
import { renderCSSElement, renderTailwindElement } from './templates';

export function generateSkeletonTSX(
  result: AnalysisResult,
  style: 'css' | 'tailwind',
  config?: SkeletonConfig
): string {
  const lines: string[] = [];

  if (result.isClientComponent) {
    lines.push("'use client';");
    lines.push('');
  }

  if (style === 'css') {
    lines.push(`import './${result.componentName}.skeleton.css';`);
    lines.push('');
  }

  lines.push(`interface ${result.componentName}SkeletonProps {`);
  lines.push(`  className?: string;`);
  lines.push(`  style?: React.CSSProperties;`);
  lines.push(`}`);
  lines.push('');

  lines.push(
    `export function ${result.componentName}Skeleton({ className, style }: ${result.componentName}SkeletonProps) {`
  );
  lines.push('  return (');

  if (result.elements.length === 0) {
    lines.push('    <div className="skeleton" />');
  } else if (result.elements.length === 1) {
    const rendered =
      style === 'css'
        ? renderCSSElement(result.elements[0], 4)
        : renderTailwindElement(result.elements[0], 4, config);
    lines.push(rendered);
  } else {
    lines.push('    <>');
    for (const element of result.elements) {
      const rendered =
        style === 'css'
          ? renderCSSElement(element, 5)
          : renderTailwindElement(element, 5, config);
      lines.push(rendered);
    }
    lines.push('    </>');
  }

  lines.push('  );');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
