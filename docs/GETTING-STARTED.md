# Getting Started

## Installation

```bash
# Global install
npm install -g react-skeleton-mirror

# Or use npx directly (no install needed)
npx react-skeleton-mirror --help

# Local dev dependency
npm install --save-dev react-skeleton-mirror
```

## Quick Start

### 1. Analyze Your Components

```bash
npx skeletonify analyze ./src/components
```

This will:
- Parse each `.tsx`/`.jsx` file
- Show element counts and suggestions
- Detect framework and `'use client'` directives
- Find sub-component imports

### 2. Generate Skeletons

```bash
npx skeletonify generate ./src/components
```

This creates:
```
src/skeletons/
  ├── UserCard.skeleton.tsx    # Skeleton component
  └── UserCard.skeleton.css    # Skeleton styles
```

### 3. Use the Skeleton

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

## Tailwind Mode

```bash
npx skeletonify generate ./src/components --style tailwind
```

This creates a single `.skeleton.tsx` file with inline Tailwind classes (no CSS file).

## Watch Mode

Auto-regenerate when files change:

```bash
npx skeletonify watch ./src/components
```

## Configuration

Create a config file:

```bash
npx skeletonify init
```

This creates `skeletonify.config.json`:

```json
{
  "style": "css",
  "output": "./src/skeletons",
  "animation": "pulse",
  "colors": {
    "primary": "#e5e7eb",
    "secondary": "#d1d5db"
  }
}
```

## Next Steps

- [Commands Reference](./COMMANDS.md)
- [Configuration Guide](./CONFIGURATION.md)
- [How It Works](./HOW-IT-WORKS.md)
- [Examples](./EXAMPLES.md)
