# Configuration Guide

## Config File

`skeletonify` looks for configuration in the following files (in order):

1. `skeletonify.config.json`
2. `skeletonify.config.js`
3. `.skeletonifyrc`

## Creating a Config File

```bash
npx skeletonify init
```

This creates a `skeletonify.config.json` with default values.

## Config Options

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

## Options Reference

### `style`

- **Type**: `"css" | "tailwind"`
- **Default**: `"css"`
- **Description**: Output style for skeleton CSS

**CSS mode** generates two files per component:
- `ComponentName.skeleton.tsx` — Skeleton React component
- `ComponentName.skeleton.css` — Skeleton styles

**Tailwind mode** generates one file:
- `ComponentName.skeleton.tsx` — Skeleton with inline Tailwind classes

### `output`

- **Type**: `string`
- **Default**: `"./src/skeletons"`
- **Description**: Output directory for generated skeletons

### `animation`

- **Type**: `"pulse" | "shimmer" | "none"`
- **Default**: `"pulse"`
- **Description**: Animation style for skeleton elements

**pulse** — Fades opacity in and out:
```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

**shimmer** — Sliding gradient effect:
```css
@keyframes skeleton-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

**none** — No animation (static placeholders)

### `colors`

```json
{
  "colors": {
    "primary": "#e5e7eb",
    "secondary": "#d1d5db"
  }
}
```

- `primary` — Main background color for skeleton elements
- `secondary` — Alternate color for avatars, images, etc.

### `patterns`

```json
{
  "patterns": {
    "avatar": { "width": 48, "height": 48, "circle": true },
    "button": { "height": 40, "borderRadius": 6 },
    "text": { "height": 16, "margin": "8px 0" }
  }
}
```

- `avatar` — Default avatar dimensions
- `button` — Default button dimensions
- `text` — Default text bar dimensions

---

## Priority Chain

Configuration values are merged in this order (highest priority wins):

1. **Default values** — built-in defaults
2. **Config file** — `skeletonify.config.json`
3. **CLI flags** — `--style`, `--output`

### Example

```bash
# Config file has: style: "tailwind"
npx skeletonify generate ./src           # Uses tailwind from config
npx skeletonify generate ./src --style css  # CLI overrides to css
```

---

## Validation

The config is validated when loaded. Invalid values will:

- Show a warning message
- Fall back to default values

### Validation Rules

| Option | Rule |
|--------|------|
| `style` | Must be `"css"` or `"tailwind"` |
| `animation` | Must be `"pulse"`, `"shimmer"`, or `"none"` |
| `output` | Must be a string |
| `colors.primary` | Must be a string |
| `colors.secondary` | Must be a string |
| `patterns.avatar.width` | Must be a number |
| `patterns.avatar.height` | Must be a number |
| `patterns.button.height` | Must be a number |
| `patterns.text.height` | Must be a number |

---

## Example Configs

### Minimal

```json
{
  "style": "tailwind"
}
```

### CSS with Custom Colors

```json
{
  "style": "css",
  "colors": {
    "primary": "#f3f4f6",
    "secondary": "#e5e7eb"
  }
}
```

### Tailwind with Shimmer

```json
{
  "style": "tailwind",
  "animation": "shimmer",
  "output": "./src/components/skeletons"
}
```

### Full Customization

```json
{
  "style": "css",
  "output": "./src/skeletons",
  "animation": "shimmer",
  "colors": {
    "primary": "#f8fafc",
    "secondary": "#e2e8f0"
  },
  "patterns": {
    "avatar": { "width": 64, "height": 64, "circle": true },
    "button": { "height": 48, "borderRadius": 8 },
    "text": { "height": 20, "margin": "12px 0" }
  }
}
```
