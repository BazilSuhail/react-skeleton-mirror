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
  ✓ UserCard.tsx (3 variants found)
  ✓ Dashboard.tsx (2 variants found)
  ✓ ProductList.tsx (1 variant found)

📋 Suggestions:
  - UserCard: Consider generating 3 skeleton variants
  - Dashboard: Has complex grid layout
  - ProductList: Has responsive design
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
import UserCardSkeleton from './skeletons/UserCard.skeleton';

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
npx skeletonify analyze <path>
```

### `generate`

Generate skeleton component files.

```bash
npx skeletonify generate <path> [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --style <style>` | CSS output: `css` or `tailwind` | `css` |
| `-o, --output <path>` | Output directory | `./src/skeletons` |
| `-t, --tests` | Generate test files | `false` |
| `-w, --watch` | Watch for changes | `false` |

**Examples:**

```bash
# CSS mode (default)
npx skeletonify generate ./src/components

# Tailwind mode
npx skeletonify generate ./src/components --style tailwind

# Custom output directory
npx skeletonify generate ./src/components --output ./src/skeletons

# Generate with tests
npx skeletonify generate ./src/components --tests
```

### `watch`

Auto-regenerate skeletons when source files change.

```bash
npx skeletonify watch <path>
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
| `<h1>`-`<h6>` | Text bar (60-80% width) |
| `<p>` | 2-3 text bars, varying widths |
| `<span>` | Short inline text bar |
| `<button>` | Button-shaped div |
| `<input>` | Full-width input-shaped div |
| Flex/grid container | Preserves layout structure |

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
```

## License

MIT

## Author

**Bazil** — [GitHub](https://github.com/BazilSuhail)
