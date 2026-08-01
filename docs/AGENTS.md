# AGENTS.md — react-skeleton-mirror (skeletonify)

## Overview

`skeletonify` is a CLI tool that analyzes React/Next.js components via AST and generates skeleton loading components. It's a dev dependency with zero runtime cost.

- **Package**: `react-skeleton-mirror`
- **CLI command**: `skeletonify`
- **Version**: 1.6.0
- **Author**: bazil
- **Repository**: https://github.com/BazilSuhail/react-skeleton-mirror

---

## Installation

```bash
# Global
npm install -g react-skeleton-mirror

# Or use npx directly
npx react-skeleton-mirror --help

# Local dev dependency
npm install --save-dev react-skeleton-mirror
```

---

## CLI Commands

### `skeletonify analyze <path> [options]`

Analyze React components and show skeleton generation suggestions.

```bash
skeletonify analyze ./src/components
skeletonify analyze ./src/components/UserCard.tsx
skeletonify analyze ./src/components --verbose
```

**Options:**
- `-v, --verbose` — Show detailed output

**What it does:**
- Parses each `.tsx`/`.jsx` file using Babel AST
- Classifies JSX elements into skeleton types
- Detects `'use client'` directive
- Detects framework (React, Next.js App Router, Next.js Pages Router)
- Resolves imported sub-components recursively
- Prints element counts, sub-component info, and suggestions

---

### `skeletonify generate <path> [options]`

Generate skeleton component files.

```bash
# Default (CSS mode)
skeletonify generate ./src/components

# Tailwind mode
skeletonify generate ./src/components --style tailwind

# Custom output
skeletonify generate ./src/components --output ./src/skeletons

# Verbose
skeletonify generate ./src/components --verbose
```

**Options:**
- `-s, --style <style>` — `css` or `tailwind` (default: from config)
- `-o, --output <path>` — Output directory (default: `./src/skeletons`)
- `-t, --tests` — Generate test files (default: false)
- `-v, --verbose` — Show detailed output

**What it does:**
- Parses the component and all sub-components
- Generates `.skeleton.tsx` file with skeleton React component
- Generates `.skeleton.css` file (CSS mode only)
- CSS mode: two files per component
- Tailwind mode: one file per component (inline classes)

---

### `skeletonify watch <path> [options]`

Auto-regenerate skeletons when source files change.

```bash
skeletonify watch ./src/components
skeletonify watch ./src/components --style tailwind --verbose
```

**Options:**
- `-s, --style <style>` — `css` or `tailwind`
- `-o, --output <path>` — Output directory
- `-v, --verbose` — Show detailed output

**What it does:**
- Uses chokidar to watch for file changes
- Auto-regenerates skeleton on file change
- Handles file additions
- Shows skeleton deletion notice (manual cleanup)
- Generates all skeletons on initial start

---

### `skeletonify init`

Create a `skeletonify.config.json` configuration file.

```bash
skeletonify init
```

**What it does:**
- Creates `skeletonify.config.json` in current directory
- Skips if file already exists
- Shows available config options

---

## Configuration

### Config File Search Order

1. `skeletonify.config.json`
2. `skeletonify.config.js`
3. `.skeletonifyrc`

### Config Priority Chain

1. **Default values** (built-in)
2. **Config file** (user)
3. **CLI flags** (highest priority)

### Config Options

```json
{
  "style": "css",           // "css" | "tailwind"
  "output": "./src/skeletons",  // Output directory
  "animation": "pulse",     // "pulse" | "shimmer" | "none"
  "colors": {
    "primary": "#e5e7eb",   // Primary skeleton color
    "secondary": "#d1d5db"  // Secondary skeleton color
  },
  "patterns": {
    "avatar": { "width": 48, "height": 48, "circle": true },
    "button": { "height": 40, "borderRadius": 6 },
    "text": { "height": 16, "margin": "8px 0" }
  }
}
```

---

## Element Detection

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

---

## Dynamic Class Name Handling

The analyzer handles these JSX className patterns:

| Pattern | Example | Extracted |
|---------|---------|-----------|
| String literal | `"bg-blue-500"` | `"bg-blue-500"` |
| Template literal | `` `base ${dynamic}` `` | `"base"` |
| Ternary | `isActive ? 'active' : 'inactive'` | Longer string |
| Logical | `isActive && 'active'` | `"active"` |
| Binary | `"foo " + bar` | `"foo"` |
| Call expression | `cn('foo', 'bar')` | `"foo bar"` |
| Identifier | `classNames` | `"classNames"` (hint) |

---

## JSX Patterns Supported

```tsx
// Fragment returns
return <><div /><div /></>;

// Conditional rendering
{condition && <Element />}
{condition ? <A /> : <B />}

// List rendering (generates single skeleton item)
{items.map(item => <Element key={item.id} />)}

// Spread props (detected but not extracted)
<div {...props} />

// Arrow functions in JSX
{items.map(item => <Card key={item.id} />)}
```

---

## Framework Detection

| Pattern | Framework |
|---------|-----------|
| Standard files | React |
| `app/` directory with `page.tsx`/`layout.tsx` | Next.js App Router |
| `pages/` directory | Next.js Pages Router |
| `'use client'` directive | Detected and preserved in skeleton |

---

## Sub-Component Resolution

- Follows relative imports (`./Badge`, `../utils/Icon`)
- Skips `node_modules` imports
- Handles `@/` alias (Next.js convention)
- Resolves `.tsx`, `.jsx`, `.ts`, `.js` extensions
- Resolves `index` files in directories
- Recursion protection (tracks analyzed files)
- Handles circular imports

---

## File Filtering

**Excluded from analysis:**
- `.test.tsx`, `.test.jsx`
- `.spec.tsx`, `.spec.jsx`
- `.story.tsx`, `.story.jsx`
- `.stories.tsx`, `.stories.jsx`
- `.skeleton.tsx`, `.skeleton.jsx`
- `node_modules/`
- Hidden directories (starting with `.`)
- Non-component files (`.ts`, `.js`, `.css`)

---

## Animation Options

### Pulse (default)
```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

### Shimmer
```css
@keyframes skeleton-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### None
No animation, static placeholders.

---

## Generated File Structure

### CSS Mode
```
src/skeletons/
  ├── ComponentName.skeleton.tsx    # Skeleton component
  └── ComponentName.skeleton.css    # Skeleton styles
```

### Tailwind Mode
```
src/skeletons/
  └── ComponentName.skeleton.tsx    # Skeleton with inline Tailwind
```

---

## Using Generated Skeletons

```tsx
import UserCard from './components/UserCard';
import { UserCardSkeleton } from './skeletons/UserCard.skeleton';

function Profile({ user, loading }) {
  if (loading) {
    return <UserCardSkeleton />;
  }
  return <UserCard user={user} />;
}

// With className override
<UserCardSkeleton className="my-custom-class" />

// With style override
<UserCardSkeleton style={{ width: '100%' }} />
```

---

## Error Handling

| Error | Behavior |
|-------|----------|
| Missing file | Shows error, exits |
| Parse error | Shows file + message, continues |
| Unresolvable import | Skips sub-component |
| Invalid style option | Shows error, exits |
| Config file error | Shows warning, uses defaults |

---

## Development

```bash
# Clone
git clone https://github.com/BazilSuhail/react-skeleton-mirror.git
cd react-skeleton-mirror

# Install
npm install

# Build
npm run build

# Watch mode
npm run dev

# Link locally
npm link

# Test commands
skeletonify --help
skeletonify init
skeletonify analyze ./test-components
skeletonify generate ./test-components --verbose
```

---

## Project Structure

```
react-skeleton-mirror/
├── package.json              # v1.6.0, bin: skeletonify
├── tsconfig.json             # ES2020, outDir ./dist
├── README.md                 # Full documentation
├── AGENTS.md                 # This file
├── .gitignore
├── .npmignore
├── src/
│   ├── cli.ts                # CLI entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── analyzer/
│   │   ├── parser.ts         # Babel AST parser
│   │   ├── classifier.ts     # Element classification
│   │   ├── resolver.ts       # Sub-component resolution
│   │   └── framework.ts      # Framework detection
│   ├── generator/
│   │   ├── templates.ts      # CSS/Tailwind rendering
│   │   └── tsx.ts            # TSX code generation
│   ├── commands/
│   │   ├── analyze.ts        # Analyze command
│   │   ├── generate.ts       # Generate command
│   │   ├── watch.ts          # Watch command
│   │   └── init.ts           # Init command
│   └── config/
│       ├── index.ts          # Config loading/merging
│       └── defaults.ts       # Default config values
├── dist/                     # Compiled output
├── test-components/          # Test components
└── docs/                     # Documentation
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/cli.ts` | CLI entry point, command definitions |
| `src/types.ts` | Shared TypeScript interfaces |
| `src/analyzer/parser.ts` | AST parsing, JSX extraction, className handling |
| `src/analyzer/classifier.ts` | Element type classification, dimension computation |
| `src/analyzer/resolver.ts` | Import resolution, recursive sub-component analysis |
| `src/analyzer/framework.ts` | React/Next.js framework detection |
| `src/generator/templates.ts` | CSS/Tailwind rendering, animation CSS generation |
| `src/generator/tsx.ts` | Skeleton TSX component code generation |
| `src/commands/analyze.ts` | Analyze command implementation |
| `src/commands/generate.ts` | Generate command implementation |
| `src/commands/watch.ts` | Watch command with chokidar |
| `src/commands/init.ts` | Init command for config file |
| `src/config/index.ts` | Config loading, deep merge, validation |
| `src/config/defaults.ts` | Default config values |
