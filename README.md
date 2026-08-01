# react-skeleton-mirror

[![npm version](https://img.shields.io/npm/v/react-skeleton-mirror.svg)](https://www.npmjs.com/package/react-skeleton-mirror)
[![npm downloads](https://img.shields.io/npm/dm/react-skeleton-mirror.svg)](https://www.npmjs.com/package/react-skeleton-mirror)
[![license](https://img.shields.io/npm/l/react-skeleton-mirror.svg)](https://github.com/BazilSuhail/react-skeleton-mirror/blob/main/LICENSE)
[![node version](https://img.shields.io/node/v/react-skeleton-mirror.svg)](https://github.com/BazilSuhail/react-skeleton-mirror)
[![TypeScript](https://img.shields.io/badge/TypeScript-supported-blue.svg)](https://www.typescriptlang.org/)

> CLI tool that analyzes your React/Next.js components and generates skeleton loading components with **zero runtime cost**.

No more wrapping components in `<Skeletonify>` or shipping extra bundle size. Just generated code you own.

## Why?

| Runtime Package | react-skeleton-mirror |
|----------------|----------------------|
| +15-20KB bundle | 0KB — generated code only |
| Runtime overhead | Zero overhead |
| Limited customization | Full control |
| Hard to debug | Just React components |
| Wrapper components needed | Import and use directly |

## Install

```bash
npm install -g react-skeleton-mirror
```

Or use directly with npx (no install needed):

```bash
npx react-skeleton-mirror --help
```

## Quick Start

### 1. Analyze your components

```bash
npx skeletonify analyze ./src/components
```

Output:
```
📊 Analyzing components...

  ✅ UserCard.tsx [use client] — 9 elements, 1 sub-component
  ✅ Dashboard.tsx — 25 elements
  ✅ ProductCard.tsx — 9 elements, 1 sub-component

📋 Suggestions:

  💡 UserCard.tsx — has images, will generate circular/rectangular placeholders
  💡 UserCard.tsx — has 2 flex/grid container(s), layout will be preserved
  🔗 UserCard.tsx — sub-components: Badge

  📊 Summary: 3 components, 43 elements, 2 sub-components
```

### 2. Generate skeletons

```bash
npx skeletonify generate ./src/components/UserCard.tsx
```

Generated files:
```
✨ Created: ./src/skeletons/UserCard.skeleton.tsx
✨ Created: ./src/skeletons/UserCard.skeleton.css
```

### 3. Use it

```tsx
import UserCard from './components/UserCard';
import { UserCardSkeleton } from './skeletons/UserCard.skeleton';

function Profile({ user, loading }) {
  if (loading) {
    return <UserCardSkeleton />;
  }
  return <UserCard user={user} />;
}
```

## Commands

### `analyze`

Analyze React components and show skeleton generation suggestions.

```bash
npx skeletonify analyze <path> [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-v, --verbose` | Show detailed output | `false` |

**Examples:**

```bash
# Analyze a single file
npx skeletonify analyze ./src/components/UserCard.tsx

# Analyze entire directory
npx skeletonify analyze ./src/components

# Verbose mode
npx skeletonify analyze ./src/components --verbose
```

### `generate`

Generate skeleton component files.

```bash
npx skeletonify generate <path> [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --style <style>` | CSS output: `css` or `tailwind` | from config |
| `-o, --output <path>` | Output directory | from config |
| `-t, --tests` | Generate test files | `false` |
| `-v, --verbose` | Show detailed output | `false` |

**Examples:**

```bash
# CSS mode (default)
npx skeletonify generate ./src/components

# Tailwind mode
npx skeletonify generate ./src/components --style tailwind

# Custom output directory
npx skeletonify generate ./src/components --output ./src/skeletons

# Verbose mode
npx skeletonify generate ./src/components --verbose
```

### `watch`

Auto-regenerate skeletons when source files change.

```bash
npx skeletonify watch <path> [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --style <style>` | CSS output: `css` or `tailwind` | from config |
| `-o, --output <path>` | Output directory | from config |
| `-v, --verbose` | Show detailed output | `false` |

**Example:**

```bash
npx skeletonify watch ./src/components --style tailwind --verbose
```

### `init`

Create a `skeletonify.config.json` configuration file.

```bash
npx skeletonify init
```

## Configuration

Create a `skeletonify.config.json` in your project root:

```json
{
  "style": "css",
  "output": "./src/skeletons",
  "animation": "pulse",
  "colors": {
    "primary": "#e5e7eb",
    "secondary": "#d1d5db"
  },
  "patterns": {
    "avatar": { "width": 48, "height": 48, "circle": true },
    "button": { "height": 40, "borderRadius": 6 },
    "text": { "height": 16, "margin": "8px 0" }
  }
}
```

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style` | `"css" \| "tailwind"` | `"css"` | Output style for skeleton CSS |
| `output` | `string` | `"./src/skeletons"` | Output directory for skeletons |
| `animation` | `"pulse" \| "shimmer" \| "none"` | `"pulse"` | Animation style |
| `colors.primary` | `string` | `"#e5e7eb"` | Primary skeleton color |
| `colors.secondary` | `string` | `"#d1d5db"` | Secondary skeleton color |
| `patterns.avatar` | `object` | `{ width: 48, height: 48, circle: true }` | Avatar dimensions |
| `patterns.button` | `object` | `{ height: 40, borderRadius: 6 }` | Button dimensions |
| `patterns.text` | `object` | `{ height: 16, margin: "8px 0" }` | Text bar dimensions |

### Priority Chain

Config values are merged in this order (highest priority wins):

1. **Default values** — built-in defaults
2. **Config file** — `skeletonify.config.json`
3. **CLI flags** — `--style`, `--output`

```bash
# Config file has: style: "tailwind"
npx skeletonify generate ./src           # Uses tailwind from config
npx skeletonify generate ./src --style css  # CLI overrides to css
```

## How It Works

1. **Parses** your React component using Babel AST
2. **Classifies** each JSX element (image, text, button, input, container)
3. **Recursively** resolves imported sub-components
4. **Detects** framework patterns (React, Next.js App Router, Pages Router)
5. **Generates** skeleton TSX + CSS/Tailwind code

### Element Detection

| Source Element | Skeleton Output |
|---------------|----------------|
| `<img>` | Circular/rectangular placeholder div |
| `<img>` with avatar classes | Circular avatar placeholder |
| `<h1>`-`<h6>` | Text bar (60-80% width) |
| `<p>` | Text bar (100% width) |
| `<span>` | Short text bar (30-50% width) |
| `<button>` | Button-shaped div |
| `<input>` / `<textarea>` | Full-width input-shaped div |
| `<a>` | Short link-shaped div |
| `<svg>` / `<i>` | Icon-sized div |
| Flex/grid container | Preserves layout structure |

### Dynamic Class Names

The analyzer handles dynamic className expressions:

```tsx
// Ternary — extracts the longer string (usually active state)
className={isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}
// → "bg-blue-500 text-white"

// Logical
className={isActive && 'active'}
// → "active"

// Template literal
className={`base ${dynamic}`}
// → "base"

// Call expression (e.g., cn, clsx)
className={cn('foo', 'bar')}
// → "foo bar"
```

### JSX Patterns Supported

```tsx
// Fragment returns
return <><div /><div /></>;

// Conditional rendering
{condition && <Element />}
{condition ? <A /> : <B />}

// List rendering
{items.map(item => <Element key={item.id} />)}

// Spread props (detected but not extracted)
<div {...props} />
```

## Supported Frameworks

- **React** — standard component detection
- **Next.js App Router** — detects `'use client'`, `app/` directory patterns
- **Next.js Pages Router** — detects `pages/` directory patterns

## TypeScript Support

Fully typed. Generated components include proper TypeScript types:

```tsx
// Generated with TypeScript
interface UserCardSkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function UserCardSkeleton({ className, style }: UserCardSkeletonProps) {
  return <div className={`skeleton ${className}`} style={style}>...</div>;
}
```

## Generated Files

### CSS Mode

Generates two files per component:

```
src/skeletons/
  ├── UserCard.skeleton.tsx    # Skeleton component
  └── UserCard.skeleton.css    # Skeleton styles
```

### Tailwind Mode

Generates one file per component:

```
src/skeletons/
  └── UserCard.skeleton.tsx    # Skeleton with inline Tailwind classes
```

## Animation Options

### Pulse (default)

Fades opacity in and out:

```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

### Shimmer

Sliding gradient effect:

```css
@keyframes skeleton-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### None

No animation (static placeholders).

## Error Handling

The tool gracefully handles:

- **Missing files** — shows error, continues with others
- **Parse errors** — catches syntax errors, shows file + message
- **Invalid imports** — skips unresolvable sub-components
- **Non-component files** — filters out `.ts`, `.js`, `.css` files
- **Test/story files** — automatically excluded

```
⚠️  Invalid.tsx — parse error: Unexpected token, expected ","
```

## Development

```bash
# Clone
git clone https://github.com/BazilSuhail/react-skeleton-mirror.git
cd react-skeleton-mirror

# Install
npm install

# Build
npm run build

# Link locally for testing
npm link

# Test commands
npx skeletonify --help
npx skeletonify init
npx skeletonify analyze ./test-components
npx skeletonify generate ./test-components --verbose
```

## License

MIT

## Author

**Bazil** — [GitHub](https://github.com/BazilSuhail)
