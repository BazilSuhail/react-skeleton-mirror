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

  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const elements: SkeletonElement[] = [];
  const imports: ImportInfo[] = [];
  let componentName = '';
  let isClientComponent = false;

  // Check for 'use client' directive
  // Babel stores directives in the program's directives array
  if (ast.program.directives) {
    for (const directive of ast.program.directives) {
      if (directive.value.type === 'DirectiveLiteral' && directive.value.value === 'use client') {
        isClientComponent = true;
        break;
      }
    }
  }
  // Also check first statement as ExpressionStatement (fallback)
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
        // Return first element from fragment
        for (const child of argument.children) {
          if (child.type === 'JSXElement') {
            rootElement = child;
            break;
          }
        }
      } else if (argument.type === 'ConditionalExpression') {
        // {condition ? <A /> : <B />}
        if (argument.consequent.type === 'JSXElement') {
          rootElement = argument.consequent;
        }
      } else if (argument.type === 'LogicalExpression') {
        // {condition && <Element />}
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
  let placeholder: string | undefined;
  let type: string | undefined;

  for (const attr of openingElement.attributes) {
    if (attr.type !== 'JSXAttribute') continue;

    const name = attr.name.name;
    if (typeof name !== 'string') continue;

    if (name === 'className' || name === 'class') {
      className = extractStringFromExpression(attr.value);
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

    if (name === 'placeholder') {
      placeholder = extractStringFromExpression(attr.value);
    }

    if (name === 'type') {
      type = extractStringFromExpression(attr.value);
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
    } else if (child.type === 'JSXExpressionContainer') {
      // Handle {items.map(...)} and {condition && <Element />}
      const expr = child.expression;
      if (expr.type === 'CallExpression') {
        // Likely a map — try to find the JSXElement inside
        const jsxInMap = findJSXInExpression(expr);
        if (jsxInMap) {
          children.push(jsxInMap);
        }
      } else if (expr.type === 'LogicalExpression') {
        // {condition && <Element />}
        if (expr.right.type === 'JSXElement') {
          const childElement = extractJSXElement(expr.right);
          if (childElement) {
            children.push(childElement);
          }
        }
      } else if (expr.type === 'ConditionalExpression') {
        // {condition ? <A /> : <B />}
        if (expr.consequent.type === 'JSXElement') {
          const childElement = extractJSXElement(expr.consequent);
          if (childElement) {
            children.push(childElement);
          }
        }
        if (expr.alternate.type === 'JSXElement') {
          const childElement = extractJSXElement(expr.alternate);
          if (childElement) {
            children.push(childElement);
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

function findJSXInExpression(expr: t.Expression): SkeletonElement | null {
  if (expr.type === 'JSXElement') {
    return extractJSXElement(expr);
  }
  if (expr.type === 'ArrowFunctionExpression' && expr.body.type === 'JSXElement') {
    return extractJSXElement(expr.body);
  }
  if (expr.type === 'ArrowFunctionExpression' && expr.body.type === 'JSXFragment') {
    // Return first element from fragment
    for (const child of expr.body.children) {
      if (child.type === 'JSXElement') {
        return extractJSXElement(child);
      }
    }
  }
  return null;
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
      // Variable reference — return the variable name for context
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
