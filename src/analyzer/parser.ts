import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { AnalysisResult, SkeletonElement } from '../types';
import { resolve, dirname } from 'path';
import { pathExists } from 'fs-extra';

export async function parseComponent(filePath: string): Promise<AnalysisResult> {
  const { readFileSync } = await import('fs');
  const code = readFileSync(filePath, 'utf-8');

  const isJsx = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
  if (!isJsx) {
    throw new Error(`Not a JSX/TSX file: ${filePath}`);
  }

  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const elements: SkeletonElement[] = [];
  const subComponents: AnalysisResult[] = [];
  let componentName = '';
  let isClientComponent = false;

  // Check for 'use client' directive
  const firstStatement = ast.program.body[0];
  if (
    firstStatement?.type === 'ExpressionStatement' &&
    firstStatement.expression.type === 'StringLiteral' &&
    firstStatement.expression.value === 'use client'
  ) {
    isClientComponent = true;
  }

  traverse(ast, {
    // Capture function component names
    FunctionDeclaration(path) {
      if (path.node.id) {
        componentName = path.node.id.name;
      }
    },
    ArrowFunctionExpression(path) {
      const parent = path.parent;
      if (
        parent.type === 'VariableDeclarator' &&
        parent.id.type === 'Identifier'
      ) {
        componentName = parent.id.name;
      }
    },
    // Capture JSX elements
    JSXElement(path) {
      const element = extractJSXElement(path.node);
      if (element) {
        elements.push(element);
      }
    },
  });

  // Determine framework
  const framework = detectFramework(filePath);

  return {
    filePath,
    componentName: componentName || extractComponentNameFromPath(filePath),
    isClientComponent,
    framework,
    elements,
    subComponents,
  };
}

function extractJSXElement(node: t.JSXElement): SkeletonElement | null {
  const openingElement = node.openingElement;
  let tagName: string;

  if (openingElement.name.type === 'JSXIdentifier') {
    tagName = openingElement.name.name;
  } else if (openingElement.name.type === 'JSXMemberExpression') {
    // e.g., <Card.Header>
    const object = openingElement.name.object;
    const property = openingElement.name.property;
    if (object.type === 'JSXIdentifier' && property.type === 'JSXIdentifier') {
      tagName = `${object.name}.${property.name}`;
    } else {
      return null;
    }
  } else {
    return null;
  }

  // Extract className
  let className: string | undefined;
  let style: Record<string, string> | undefined;

  for (const attr of openingElement.attributes) {
    if (attr.type !== 'JSXAttribute') continue;

    if (attr.name.name === 'className' || attr.name.name === 'class') {
      className = extractStringFromExpression(attr.value);
    }

    if (attr.name.name === 'style' && attr.value?.type === 'JSXExpressionContainer') {
      const expr = attr.value.expression;
      if (expr.type !== 'JSXEmptyExpression') {
        style = extractStyleObject(expr);
      }
    }
  }

  // Extract text content
  let text: string | undefined;
  const children: SkeletonElement[] = [];

  for (const child of node.children) {
    if (child.type === 'JSXText') {
      const trimmed = child.value.trim();
      if (trimmed) {
        text = trimmed;
      }
    } else if (child.type === 'JSXElement') {
      const childElement = extractJSXElement(child);
      if (childElement) {
        children.push(childElement);
      }
    }
  }

  const type = classifyElement(tagName, className, text);

  return {
    type,
    tagName,
    className,
    style,
    text,
    children,
  };
}

function classifyElement(
  tagName: string,
  className?: string,
  text?: string
): SkeletonElement['type'] {
  const tag = tagName.toLowerCase();

  if (tag === 'img') return 'IMAGE';
  if (/^h[1-6]$/.test(tag)) return 'HEADING';
  if (tag === 'p') return 'TEXT';
  if (tag === 'span') return 'TEXT';
  if (tag === 'button') return 'BUTTON';
  if (tag === 'input' || tag === 'textarea') return 'INPUT';
  if (tag === 'a') return 'LINK';

  // Check className for layout indicators
  if (className) {
    const hasLayout =
      /\b(flex|grid|inline-flex|inline-grid)\b/.test(className);
    if (hasLayout) return 'CONTAINER';
  }

  return 'WRAPPER';
}

function extractStringFromExpression(
  expression: t.JSXAttribute['value']
): string | undefined {
  if (!expression) return undefined;

  if (expression.type === 'StringLiteral') {
    return expression.value;
  }

  if (expression.type === 'JSXExpressionContainer') {
    const expr = expression.expression;
    if (expr.type === 'StringLiteral') {
      return expr.value;
    }
    if (expr.type === 'TemplateLiteral') {
      // Simple template literal - just return raw for now
      return expr.quasis.map((q) => q.value.cooked || q.value.raw).join('');
    }
  }

  return undefined;
}

function extractStyleObject(
  expression: t.Expression
): Record<string, string> | undefined {
  if (expression.type !== 'ObjectExpression') return undefined;

  const style: Record<string, string> = {};

  for (const prop of expression.properties) {
    if (prop.type !== 'ObjectProperty') continue;
    if (prop.key.type !== 'Identifier') continue;

    const value = prop.value;
    if (value.type === 'StringLiteral') {
      style[prop.key.name] = value.value;
    }
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

function extractComponentNameFromPath(filePath: string): string {
  const fileName = filePath.split(/[/\\]/).pop() || '';
  return fileName
    .replace(/\.(jsx|tsx|js|ts)$/, '')
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function detectFramework(filePath: string): AnalysisResult['framework'] {
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.includes('/app/') && normalizedPath.includes('/page.')) {
    return 'nextjs-app';
  }
  if (normalizedPath.includes('/pages/')) {
    return 'nextjs-pages';
  }
  return 'react';
}
