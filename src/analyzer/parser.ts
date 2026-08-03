import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { readFile } from 'fs-extra';
import { AnalysisResult, SkeletonElement, ImportInfo } from '../types';
import { classifyElement, computeDimensions } from './classifier';
import { resolveImports } from './resolver';
import { detectFramework } from './framework';

const MAX_JSX_DEPTH = 20;

export async function parseComponent(
  filePath: string,
  analyzedFiles?: Set<string>
): Promise<AnalysisResult> {
  const code = await readFile(filePath, 'utf-8');

  let ast: t.File;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Parse error in ${filePath}: ${message}`);
  }

  const elements: SkeletonElement[] = [];
  const imports: ImportInfo[] = [];
  let componentName = '';
  let isClientComponent = false;

  if (ast.program.directives) {
    for (const directive of ast.program.directives) {
      if (directive.value.type === 'DirectiveLiteral' && directive.value.value === 'use client') {
        isClientComponent = true;
        break;
      }
    }
  }
  if (!isClientComponent) {
    const firstStatement = ast.program.body[0];
    if (
      firstStatement?.type === 'ExpressionStatement' &&
      firstStatement.expression.type === 'StringLiteral' &&
      firstStatement.expression.value === 'use client'
    ) {
      isClientComponent = true;
    }
  }

  traverse(ast, {
    ExportNamedDeclaration(path) {
      const decl = path.node.declaration;
      if (decl?.type === 'FunctionDeclaration' && decl.id) {
        componentName = decl.id.name;
      }
    },
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration;
      if (decl?.type === 'FunctionDeclaration' && decl.id) {
        componentName = decl.id.name;
      } else if (decl?.type === 'Identifier') {
        componentName = decl.name;
      }
    },
    FunctionDeclaration(path) {
      if (path.node.id && !componentName) {
        componentName = path.node.id.name;
      }
    },
    VariableDeclarator(path) {
      if (
        path.node.id.type === 'Identifier' &&
        (path.node.init?.type === 'ArrowFunctionExpression' ||
          path.node.init?.type === 'FunctionExpression')
      ) {
        if (!componentName) {
          componentName = path.node.id.name;
        }
      }
    },
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (typeof source !== 'string') return;

      for (const specifier of path.node.specifiers) {
        if (specifier.type === 'ImportDefaultSpecifier') {
          imports.push({
            componentName: specifier.local.name,
            sourcePath: source,
            isDefault: true,
          });
        } else if (specifier.type === 'ImportSpecifier') {
          const imported = specifier.imported;
          const name = imported.type === 'Identifier' ? imported.name : imported.value;
          imports.push({
            componentName: name,
            sourcePath: source,
            isDefault: false,
          });
        }
      }
    },
    ReturnStatement(path) {
      const argument = path.node.argument;
      if (!argument) return;

      let rootElement: t.JSXElement | null = null;

      if (argument.type === 'JSXElement') {
        rootElement = argument;
      } else if (argument.type === 'JSXFragment') {
        const fragmentChildren: SkeletonElement[] = [];
        for (const child of argument.children) {
          if (child.type === 'JSXElement') {
            const el = extractJSXElement(child);
            if (el) fragmentChildren.push(el);
          } else if (child.type === 'JSXExpressionContainer') {
            const expr = child.expression;
            if (expr.type === 'JSXElement') {
              const el = extractJSXElement(expr);
              if (el) fragmentChildren.push(el);
            }
          }
        }
        if (fragmentChildren.length > 0) {
          elements.push(...fragmentChildren);
        }
        return;
      } else if (argument.type === 'ConditionalExpression') {
        if (argument.consequent.type === 'JSXElement') {
          rootElement = argument.consequent;
        } else if (argument.consequent.type === 'JSXFragment') {
          for (const child of argument.consequent.children) {
            if (child.type === 'JSXElement') {
              rootElement = child;
              break;
            }
          }
        }
      } else if (argument.type === 'LogicalExpression') {
        if (argument.right.type === 'JSXElement') {
          rootElement = argument.right;
        }
      }

      if (rootElement) {
        const element = extractJSXElement(rootElement);
        if (element) {
          elements.push(element);
        }
      }
    },
  });

  const subComponents = await resolveImports(imports, filePath, analyzedFiles);
  const framework = detectFramework(filePath);

  return {
    filePath,
    componentName: componentName || extractComponentNameFromPath(filePath),
    isClientComponent,
    framework,
    elements,
    subComponents,
    imports,
  };
}

function extractJSXElement(node: t.JSXElement, depth: number = 0): SkeletonElement | null {
  if (depth > MAX_JSX_DEPTH) return null;

  const openingElement = node.openingElement;
  let tagName: string;

  if (openingElement.name.type === 'JSXIdentifier') {
    tagName = openingElement.name.name;
  } else if (openingElement.name.type === 'JSXMemberExpression') {
    const object = openingElement.name.object;
    const property = openingElement.name.property;
    if (object.type === 'JSXIdentifier' && property.type === 'JSXIdentifier') {
      tagName = `${object.name}.${property.name}`;
    } else {
      return null;
    }
  } else if (openingElement.name.type === 'JSXNamespacedName') {
    const ns = openingElement.name.namespace;
    const name = openingElement.name.name;
    if (ns.type === 'JSXIdentifier' && name.type === 'JSXIdentifier') {
      tagName = `${ns.name}:${name.name}`;
    } else {
      return null;
    }
  } else {
    return null;
  }

  let className: string | undefined;
  let style: Record<string, string> | undefined;
  let src: string | undefined;
  let alt: string | undefined;

  for (const attr of openingElement.attributes) {
    if (attr.type === 'JSXSpreadAttribute') {
      continue;
    }

    const name = attr.name.name;
    if (typeof name !== 'string') continue;

    if (name === 'className' || name === 'class') {
      className = extractClassName(attr.value);
    }

    if (name === 'style' && attr.value?.type === 'JSXExpressionContainer') {
      const expr = attr.value.expression;
      if (expr.type !== 'JSXEmptyExpression') {
        style = extractStyleObject(expr);
      }
    }

    if (name === 'src') {
      src = extractStringFromExpression(attr.value);
    }

    if (name === 'alt') {
      alt = extractStringFromExpression(attr.value);
    }
  }

  let text: string | undefined;
  const children: SkeletonElement[] = [];

  for (const child of node.children) {
    if (child.type === 'JSXText') {
      const trimmed = child.value.trim();
      if (trimmed) {
        text = trimmed;
      }
    } else if (child.type === 'JSXElement') {
      const childElement = extractJSXElement(child, depth + 1);
      if (childElement) {
        children.push(childElement);
      }
    } else if (child.type === 'JSXFragment') {
      for (const fragmentChild of child.children) {
        if (fragmentChild.type === 'JSXElement') {
          const el = extractJSXElement(fragmentChild, depth + 1);
          if (el) children.push(el);
        }
      }
    } else if (child.type === 'JSXExpressionContainer') {
      const expr = child.expression;
      if (expr.type !== 'JSXEmptyExpression') {
        const extracted = extractJSXFromExpression(expr, depth + 1);
        if (extracted) {
          if (Array.isArray(extracted)) {
            children.push(...extracted);
          } else {
            children.push(extracted);
          }
        }
      }
    }
  }

  const type_ = classifyElement(tagName, className, text, src, alt);
  const dimensions = computeDimensions(type_, className, style, src);

  return {
    type: type_,
    tagName,
    className,
    style,
    text,
    width: dimensions.width,
    height: dimensions.height,
    isCircle: dimensions.isCircle,
    isLayout: dimensions.isLayout,
    children,
  };
}

function extractJSXFromExpression(
  expr: t.Expression | t.JSXEmptyExpression,
  depth: number = 0
): SkeletonElement[] {
  if (expr.type === 'JSXEmptyExpression') return [];

  if (expr.type === 'JSXElement') {
    const el = extractJSXElement(expr, depth);
    return el ? [el] : [];
  }

  if (expr.type === 'ArrowFunctionExpression') {
    if (expr.body.type === 'JSXElement') {
      const el = extractJSXElement(expr.body, depth);
      return el ? [el] : [];
    }
    if (expr.body.type === 'JSXFragment') {
      const results: SkeletonElement[] = [];
      for (const child of expr.body.children) {
        if (child.type === 'JSXElement') {
          const el = extractJSXElement(child, depth);
          if (el) results.push(el);
        }
      }
      return results;
    }
    if (expr.body.type === 'BlockStatement') {
      for (const stmt of expr.body.body) {
        if (stmt.type === 'ReturnStatement' && stmt.argument) {
          return extractJSXFromExpression(stmt.argument as t.Expression, depth);
        }
      }
    }
  }

  if (expr.type === 'CallExpression') {
    return extractJSXFromCallExpression(expr, depth);
  }

  if (expr.type === 'LogicalExpression') {
    if (expr.right.type === 'JSXElement') {
      const el = extractJSXElement(expr.right, depth);
      return el ? [el] : [];
    }
    if (expr.right.type === 'JSXFragment') {
      const results: SkeletonElement[] = [];
      for (const child of expr.right.children) {
        if (child.type === 'JSXElement') {
          const el = extractJSXElement(child, depth);
          if (el) results.push(el);
        }
      }
      return results;
    }
  }

  if (expr.type === 'ConditionalExpression') {
    const results: SkeletonElement[] = [];
    if (expr.consequent.type === 'JSXElement') {
      const el = extractJSXElement(expr.consequent, depth);
      if (el) results.push(el);
    }
    if (expr.alternate.type === 'JSXElement') {
      const el = extractJSXElement(expr.alternate, depth);
      if (el) results.push(el);
    }
    return results;
  }

  return [];
}

function extractJSXFromCallExpression(
  expr: t.CallExpression,
  depth: number = 0
): SkeletonElement[] {
  const callee = expr.callee;

  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    if (callee.property.name === 'map' || callee.property.name === 'flatMap') {
      if (expr.arguments.length > 0) {
        const callback = expr.arguments[0];
        if (callback.type === 'ArrowFunctionExpression') {
          return extractJSXFromExpression(callback.body as t.Expression, depth);
        }
        if (callback.type === 'FunctionExpression') {
          for (const stmt of callback.body.body) {
            if (stmt.type === 'ReturnStatement' && stmt.argument) {
              return extractJSXFromExpression(stmt.argument as t.Expression, depth);
            }
          }
        }
      }
    }
  }

  return [];
}

function extractClassName(
  value: t.JSXAttribute['value']
): string | undefined {
  if (!value) return undefined;

  if (value.type === 'StringLiteral') {
    return value.value;
  }

  if (value.type === 'JSXExpressionContainer') {
    const expr = value.expression;
    if (expr.type === 'JSXEmptyExpression') return undefined;

    return extractClassNameFromExpression(expr);
  }

  return undefined;
}

function extractClassNameFromExpression(
  expr: t.Expression | t.JSXEmptyExpression
): string | undefined {
  if (expr.type === 'JSXEmptyExpression') return undefined;

  if (expr.type === 'StringLiteral') {
    return expr.value;
  }

  if (expr.type === 'TemplateLiteral') {
    return expr.quasis
      .map((q) => q.value.cooked || q.value.raw)
      .join(' ')
      .trim() || undefined;
  }

  if (expr.type === 'ConditionalExpression') {
    const consequent =
      expr.consequent.type === 'StringLiteral'
        ? expr.consequent.value
        : extractClassNameFromExpression(expr.consequent);
    const alternate =
      expr.alternate.type === 'StringLiteral'
        ? expr.alternate.value
        : extractClassNameFromExpression(expr.alternate);

    if (consequent && alternate) {
      return consequent.length >= alternate.length ? consequent : alternate;
    }
    return consequent || alternate;
  }

  if (expr.type === 'LogicalExpression') {
    if (expr.right.type === 'StringLiteral') {
      return expr.right.value;
    }
    return extractClassNameFromExpression(expr.right);
  }

  if (expr.type === 'BinaryExpression' && expr.operator === '+') {
    const left =
      expr.left.type === 'StringLiteral' ? expr.left.value : undefined;
    const right =
      expr.right.type === 'StringLiteral' ? expr.right.value : undefined;
    return [left, right].filter(Boolean).join(' ') || undefined;
  }

  if (expr.type === 'Identifier') {
    return expr.name;
  }

  if (expr.type === 'CallExpression') {
    const strings: string[] = [];
    for (const arg of expr.arguments) {
      if (arg.type === 'StringLiteral') {
        strings.push(arg.value);
      } else if (arg.type === 'ConditionalExpression') {
        const extracted = extractClassNameFromExpression(arg);
        if (extracted) strings.push(extracted);
      }
    }
    return strings.length > 0 ? strings.join(' ') : undefined;
  }

  return undefined;
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
      return expr.quasis.map((q) => q.value.cooked || q.value.raw).join('');
    }
    if (expr.type === 'Identifier') {
      return expr.name;
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
    if (prop.key.type !== 'Identifier' && prop.key.type !== 'StringLiteral') continue;

    const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
    const value = prop.value;

    if (value.type === 'StringLiteral') {
      style[key] = value.value;
    } else if (value.type === 'NumericLiteral') {
      style[key] = `${value.value}px`;
    } else if (value.type === 'UnaryExpression' && value.operator === '-' && value.argument.type === 'NumericLiteral') {
      style[key] = `-${value.argument.value}px`;
    }
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

function extractComponentNameFromPath(filePath: string): string {
  const fileName = filePath.split(/[/\\]/).pop() || '';
  const baseName = fileName
    .replace(/\.(jsx|tsx|js|ts)$/, '')
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  if (baseName.toLowerCase() === 'index') {
    const parts = filePath.split(/[/\\]/);
    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i];
      if (part && part !== 'src' && part !== 'components' && part !== 'app' && part !== 'pages') {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
    }
  }

  return baseName;
}
