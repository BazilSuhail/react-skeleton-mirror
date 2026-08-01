import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { readFileSync } from 'fs';
import { AnalysisResult, SkeletonElement, ImportInfo } from '../types';
import { classifyElement, computeDimensions } from './classifier';
import { resolveImports } from './resolver';
import { detectFramework } from './framework';

export async function parseComponent(filePath: string): Promise<AnalysisResult> {
  const code = readFileSync(filePath, 'utf-8');

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

  // Check for 'use client' directive
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
    // Capture function component names (named export)
    ExportNamedDeclaration(path) {
      const decl = path.node.declaration;
      if (decl?.type === 'FunctionDeclaration' && decl.id) {
        componentName = decl.id.name;
      }
    },
    // Capture default export component names
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration;
      if (decl?.type === 'FunctionDeclaration' && decl.id) {
        componentName = decl.id.name;
      } else if (decl?.type === 'Identifier') {
        componentName = decl.name;
      }
    },
    // Capture function declarations
    FunctionDeclaration(path) {
      if (path.node.id && !componentName) {
        componentName = path.node.id.name;
      }
    },
    // Capture const Component = () => {} patterns
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
    // Track imports
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
    // Capture only the ROOT JSX element returned by the component
    ReturnStatement(path) {
      const argument = path.node.argument;
      if (!argument) return;

      let rootElement: t.JSXElement | null = null;

      if (argument.type === 'JSXElement') {
        rootElement = argument;
      } else if (argument.type === 'JSXFragment') {
        // Handle fragments — collect all child elements
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

  // Resolve sub-components
  const subComponents = await resolveImports(imports, filePath);

  // Determine framework
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

function extractJSXElement(node: t.JSXElement): SkeletonElement | null {
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

  // Extract attributes
  let className: string | undefined;
  let style: Record<string, string> | undefined;
  let src: string | undefined;
  let alt: string | undefined;
  let hasSpreadProps = false;

  for (const attr of openingElement.attributes) {
    if (attr.type === 'JSXSpreadAttribute') {
      hasSpreadProps = true;
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

  // Extract children
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
    } else if (child.type === 'JSXFragment') {
      // Handle fragments inside children
      for (const fragmentChild of child.children) {
        if (fragmentChild.type === 'JSXElement') {
          const el = extractJSXElement(fragmentChild);
          if (el) children.push(el);
        }
      }
    } else if (child.type === 'JSXExpressionContainer') {
      const expr = child.expression;
      if (expr.type !== 'JSXEmptyExpression') {
        const extracted = extractJSXFromExpression(expr);
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

  // Classify the element with sizing
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

/**
 * Extract JSX elements from various expression types.
 */
function extractJSXFromExpression(
  expr: t.Expression | t.JSXEmptyExpression
): SkeletonElement | SkeletonElement[] | null {
  if (expr.type === 'JSXEmptyExpression') return null;

  // Direct JSX element
  if (expr.type === 'JSXElement') {
    return extractJSXElement(expr);
  }

  // Arrow function returning JSX
  if (expr.type === 'ArrowFunctionExpression') {
    if (expr.body.type === 'JSXElement') {
      return extractJSXElement(expr.body);
    }
    if (expr.body.type === 'JSXFragment') {
      const results: SkeletonElement[] = [];
      for (const child of expr.body.children) {
        if (child.type === 'JSXElement') {
          const el = extractJSXElement(child);
          if (el) results.push(el);
        }
      }
      return results.length > 0 ? results : null;
    }
    // Block body with return
    if (expr.body.type === 'BlockStatement') {
      for (const stmt of expr.body.body) {
        if (stmt.type === 'ReturnStatement' && stmt.argument) {
          const result = extractJSXFromExpression(stmt.argument as t.Expression);
          if (result) return result;
        }
      }
    }
  }

  // Call expression (e.g., items.map(...))
  if (expr.type === 'CallExpression') {
    return extractJSXFromCallExpression(expr);
  }

  // Logical expression (e.g., condition && <Element />)
  if (expr.type === 'LogicalExpression') {
    if (expr.right.type === 'JSXElement') {
      return extractJSXElement(expr.right);
    }
    if (expr.right.type === 'JSXFragment') {
      const results: SkeletonElement[] = [];
      for (const child of expr.right.children) {
        if (child.type === 'JSXElement') {
          const el = extractJSXElement(child);
          if (el) results.push(el);
        }
      }
      return results.length > 0 ? results : null;
    }
  }

  // Conditional expression (e.g., condition ? <A /> : <B />)
  if (expr.type === 'ConditionalExpression') {
    const results: SkeletonElement[] = [];
    if (expr.consequent.type === 'JSXElement') {
      const el = extractJSXElement(expr.consequent);
      if (el) results.push(el);
    }
    if (expr.alternate.type === 'JSXElement') {
      const el = extractJSXElement(expr.alternate);
      if (el) results.push(el);
    }
    return results.length > 0 ? results : null;
  }

  // Member expression (e.g., components[0])
  if (expr.type === 'MemberExpression' && expr.property.type === 'Identifier') {
    // Skip — likely a component reference
    return null;
  }

  // Identifier — likely a component variable
  if (expr.type === 'Identifier') {
    return null;
  }

  return null;
}

/**
 * Extract JSX from call expressions like .map(), .filter(), etc.
 */
function extractJSXFromCallExpression(
  expr: t.CallExpression
): SkeletonElement | SkeletonElement[] | null {
  const callee = expr.callee;

  // item.map(...)
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    if (callee.property.name === 'map' || callee.property.name === 'flatMap') {
      if (expr.arguments.length > 0) {
        const callback = expr.arguments[0];
        if (callback.type === 'ArrowFunctionExpression') {
          return extractJSXFromExpression(callback.body as t.Expression);
        }
        if (callback.type === 'FunctionExpression') {
          for (const stmt of callback.body.body) {
            if (stmt.type === 'ReturnStatement' && stmt.argument) {
              return extractJSXFromExpression(stmt.argument as t.Expression);
            }
          }
        }
      }
    }
  }

  // React.createElement(...)
  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'React' &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'createElement'
  ) {
    // Skip — React.createElement calls
    return null;
  }

  return null;
}

/**
 * Extract className from various expression types.
 * Handles:
 * - String literals: "foo bar"
 * - Template literals: `foo ${dynamic} bar`
 * - Ternary: condition ? "foo" : "bar"
 * - Logical: isActive && "foo"
 * - Concatenation: "foo " + bar
 * - Variable references: classNames
 */
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

  // String literal
  if (expr.type === 'StringLiteral') {
    return expr.value;
  }

  // Template literal — extract static parts
  if (expr.type === 'TemplateLiteral') {
    return expr.quasis
      .map((q) => q.value.cooked || q.value.raw)
      .join(' ')
      .trim() || undefined;
  }

  // Ternary — take the consequent (most common case)
  if (expr.type === 'ConditionalExpression') {
    const consequent =
      expr.consequent.type === 'StringLiteral'
        ? expr.consequent.value
        : extractClassNameFromExpression(expr.consequent);
    const alternate =
      expr.alternate.type === 'StringLiteral'
        ? expr.alternate.value
        : extractClassNameFromExpression(expr.alternate);

    // Return the longer one (usually the "active" state)
    if (consequent && alternate) {
      return consequent.length >= alternate.length ? consequent : alternate;
    }
    return consequent || alternate;
  }

  // Logical expression (e.g., isActive && "foo")
  if (expr.type === 'LogicalExpression') {
    if (expr.right.type === 'StringLiteral') {
      return expr.right.value;
    }
    return extractClassNameFromExpression(expr.right);
  }

  // Binary expression (e.g., "foo " + bar)
  if (expr.type === 'BinaryExpression' && expr.operator === '+') {
    const left =
      expr.left.type === 'StringLiteral' ? expr.left.value : undefined;
    const right =
      expr.right.type === 'StringLiteral' ? expr.right.value : undefined;
    return [left, right].filter(Boolean).join(' ') || undefined;
  }

  // Identifier — return the variable name as a hint
  if (expr.type === 'Identifier') {
    return expr.name;
  }

  // Call expression (e.g., cn("foo", "bar"))
  if (expr.type === 'CallExpression') {
    // Try to extract string arguments
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
  return fileName
    .replace(/\.(jsx|tsx|js|ts)$/, '')
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
