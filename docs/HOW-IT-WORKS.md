# How It Works

## Overview

`skeletonify` analyzes React components using Babel AST (Abstract Syntax Tree) and generates skeleton loading components that match the original structure.

## Pipeline

```
Input (.tsx/.jsx)
    ↓
Parse (Babel AST)
    ↓
Extract JSX Elements
    ↓
Classify Elements
    ↓
Compute Dimensions
    ↓
Resolve Sub-components
    ↓
Detect Framework
    ↓
Generate Skeleton TSX
    ↓
Generate CSS/Tailwind
    ↓
Output Files
```

---

## Step 1: Parse

The parser reads the source file and creates an AST using `@babel/parser`.

```typescript
import { parse } from '@babel/parser';

const ast = parse(code, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript'],
});
```

Supports:
- JSX syntax
- TypeScript syntax
- ES modules
- CommonJS

---

## Step 2: Extract JSX

The parser traverses the AST to find:

- **Return statements** — The root JSX element(s) returned by the component
- **JSX elements** — All nested elements
- **Attributes** — `className`, `style`, `src`, `alt`
- **Children** — Text content and nested elements

### What Gets Extracted

```tsx
// This component:
export default function UserCard() {
  return (
    <div className="flex gap-4">
      <img src="/avatar.jpg" className="rounded-full" />
      <div>
        <h2 className="text-lg font-bold">Name</h2>
        <p className="text-gray-500">Description</p>
      </div>
      <button className="bg-blue-500">Follow</button>
    </div>
  );
}

// Produces these skeleton elements:
// - CONTAINER (div with flex)
//   - AVATAR (img with rounded-full)
//   - CONTAINER (div)
//     - HEADING (h2)
//     - TEXT (p)
//   - BUTTON (button)
```

---

## Step 3: Classify Elements

Each JSX element is classified into a skeleton type:

| JSX Tag | Skeleton Type |
|---------|---------------|
| `<img>` | IMAGE or AVATAR |
| `<h1>`-`<h6>` | HEADING |
| `<p>` | TEXT |
| `<span>` | TEXT |
| `<button>` | BUTTON |
| `<input>`, `<textarea>` | INPUT |
| `<a>` | LINK |
| `<svg>`, `<i>` | ICON |
| Flex/grid container | CONTAINER |
| Other | WRAPPER |

### Classification Rules

```typescript
// Avatar detection
if (tag === 'img') {
  if (/\b(avatar|profile|user|icon)\b/i.test(className)) {
    return 'AVATAR';
  }
  return 'IMAGE';
}

// Container detection
if (/\b(flex|grid|inline-flex|inline-grid)\b/.test(className)) {
  return 'CONTAINER';
}
```

---

## Step 4: Compute Dimensions

Each element type has default dimensions:

### AVATAR
```typescript
{ width: '48px', height: '48px', isCircle: true }
```

### IMAGE
```typescript
{ width: '100%', height: 'auto' }
```

### HEADING
```typescript
{ width: '65%', height: undefined }
```

### TEXT
```typescript
{ width: '100%', height: undefined }
```

### BUTTON
```typescript
{ width: '120px', height: '40px' }
```

### INPUT
```typescript
{ width: '100%', height: '40px' }
```

### LINK
```typescript
{ width: '30%', height: undefined }
```

### ICON
```typescript
{ width: '24px', height: '24px' }
```

Dimensions can be overridden by:
- Tailwind classes (`w-8`, `h-10`, etc.)
- Inline styles (`style={{ width: '100px' }}`)
- Config patterns

---

## Step 5: Resolve Sub-components

The resolver follows imports to find sub-components:

```typescript
// Given this import:
import Badge from './Badge';

// The resolver:
1. Finds Badge.tsx in the same directory
2. Parses it
3. Extracts its elements
4. Includes them in the analysis
```

### Resolution Rules

- Follows relative imports (`./`, `../`)
- Skips `node_modules`
- Handles `@/` alias (Next.js)
- Resolves `.tsx`, `.jsx`, `index.*` files
- Prevents infinite recursion

---

## Step 6: Detect Framework

The framework detector checks file path patterns:

```typescript
// Next.js App Router
if (path.includes('/app/') && 
    (path.includes('/page.') || path.includes('/layout.'))) {
  return 'nextjs-app';
}

// Next.js Pages Router
if (path.includes('/pages/')) {
  return 'nextjs-pages';
}

// Default
return 'react';
```

### 'use client' Detection

The parser checks for the `'use client'` directive:

```typescript
// Directives
if (ast.program.directives) {
  for (const directive of ast.program.directives) {
    if (directive.value.value === 'use client') {
      isClientComponent = true;
    }
  }
}

// Or as first expression
if (firstStatement.expression.value === 'use client') {
  isClientComponent = true;
}
```

This is preserved in the generated skeleton.

---

## Step 7: Generate TSX

The TSX generator creates a React component:

```typescript
export function generateSkeletonTSX(result, style) {
  const lines = [];
  
  // 'use client' if needed
  if (result.isClientComponent) {
    lines.push("'use client';");
  }
  
  // CSS import (CSS mode only)
  if (style === 'css') {
    lines.push(`import './${result.componentName}.skeleton.css';`);
  }
  
  // Props interface
  lines.push(`interface ${result.componentName}SkeletonProps {`);
  lines.push(`  className?: string;`);
  lines.push(`  style?: React.CSSProperties;`);
  lines.push(`}`);
  
  // Component
  lines.push(`export function ${result.componentName}Skeleton(...) {`);
  lines.push('  return (');
  
  // Render element tree
  for (const element of result.elements) {
    lines.push(renderElement(element, style));
  }
  
  lines.push('  );');
  lines.push('}');
  
  return lines.join('\n');
}
```

---

## Step 8: Generate CSS (CSS Mode)

The CSS generator creates styles for all skeleton elements:

```css
/* Base styles */
.skeleton {
  background: #e5e7eb;
  border-radius: 4px;
}

/* Element-specific styles */
.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #d1d5db;
}

.skeleton-text {
  height: 16px;
  background: #d1d5db;
  border-radius: 4px;
  margin: 8px 0;
}

/* Animation */
.skeleton,
.skeleton-avatar,
.skeleton-text {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

---

## Step 9: Generate Tailwind (Tailwind Mode)

In Tailwind mode, classes are applied inline:

```tsx
<div className="bg-gray-300 animate-pulse rounded-full w-12 h-12" />
<div className="bg-gray-300 animate-pulse rounded h-4 w-full" />
```

### Tailwind Class Mapping

| Element | Classes |
|---------|---------|
| Base | `bg-gray-300 animate-pulse` |
| Circle | `rounded-full` |
| Non-circle | `rounded` |
| Container | Extracts layout classes (flex, grid, gap, etc.) |

---

## Dynamic Class Name Handling

The parser handles various className patterns:

```tsx
// Ternary — takes the longer string
className={isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}
// → "bg-blue-500 text-white"

// Logical — takes the right side
className={isActive && 'active'}
// → "active"

// Template literal — joins static parts
className={`base ${dynamic}`}
// → "base"

// Call expression — joins string arguments
className={cn('foo', 'bar')}
// → "foo bar"
```
