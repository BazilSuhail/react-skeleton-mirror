# Commands Reference

## `skeletonify analyze <path> [options]`

Analyze React components and show skeleton generation suggestions.

### Usage

```bash
# Analyze a single file
skeletonify analyze ./src/components/UserCard.tsx

# Analyze entire directory
skeletonify analyze ./src/components

# Verbose mode
skeletonify analyze ./src/components --verbose
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-v, --verbose` | Show detailed output | `false` |

### Example Output

```
📊 Analyzing components...

  📋 Config:
     style: css
     output: ./src/skeletons
     animation: pulse
     colors: { primary: #e5e7eb, secondary: #d1d5db }
     verbose: true

  ✅ Badge.tsx — 1 element
  ✅ Dashboard.tsx — 25 elements
  ✅ ProductCard.tsx — 9 elements, 1 sub-component
  ✅ StarRating.tsx — 3 elements
  ✅ UserCard.tsx [use client] — 9 elements, 1 sub-component

📋 Suggestions:

  💡 Dashboard.tsx — has 7 text elements, skeleton will have multiple text bars
  💡 Dashboard.tsx — has 6 flex/grid container(s), layout will be preserved
  💡 Dashboard.tsx — has button(s), will generate button-shaped placeholders
  💡 ProductCard.tsx — has images, will generate circular/rectangular placeholders
  💡 ProductCard.tsx — has 1 flex/grid container(s), layout will be preserved
  💡 ProductCard.tsx — has button(s), will generate button-shaped placeholders
  🔗 ProductCard.tsx — sub-components: StarRating
  💡 StarRating.tsx — has 1 flex/grid container(s), layout will be preserved
  💡 UserCard.tsx — has images, will generate circular/rectangular placeholders
  💡 UserCard.tsx — has 2 flex/grid container(s), layout will be preserved
  💡 UserCard.tsx — has button(s), will generate button-shaped placeholders
  🔗 UserCard.tsx — sub-components: Badge

  📊 Summary: 5 components,
     47 elements, 2 sub-components
```

---

## `skeletonify generate <path> [options]`

Generate skeleton component files.

### Usage

```bash
# CSS mode (default)
skeletonify generate ./src/components

# Tailwind mode
skeletonify generate ./src/components --style tailwind

# Custom output directory
skeletonify generate ./src/components --output ./src/skeletons

# Verbose mode
skeletonify generate ./src/components --verbose
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --style <style>` | CSS output: `css` or `tailwind` | from config |
| `-o, --output <path>` | Output directory | from config |
| `-t, --tests` | Generate test files | `false` |
| `-v, --verbose` | Show detailed output | `false` |

### Example Output

```
✨ Generating skeletons...

  Style: css
  Output: ./src/skeletons
  📋 Config:
     style: css
     output: ./src/skeletons
     animation: pulse
     colors: { primary: #e5e7eb, secondary: #d1d5db }
     verbose: true

  📁 Found 5 component(s)

  🔍 Parsing Badge.tsx...
  ✅ Badge.tsx → Badge.skeleton.tsx
     Badge.skeleton.css
  🔍 Parsing Dashboard.tsx...
  ✅ Dashboard.tsx → Dashboard.skeleton.tsx
     Dashboard.skeleton.css
  🔍 Parsing ProductCard.tsx...
  ✅ ProductCard.tsx → ProductCard.skeleton.tsx
     ProductCard.skeleton.css
  🔍 Parsing StarRating.tsx...
  ✅ StarRating.tsx → StarRating.skeleton.tsx
     StarRating.skeleton.css
  🔍 Parsing UserCard.tsx...
  ✅ UserCard.tsx → UserCard.skeleton.tsx
     UserCard.skeleton.css

  📊 Generated 5 skeletons
```

---

## `skeletonify watch <path> [options]`

Auto-regenerate skeletons when source files change.

### Usage

```bash
# Watch a directory
skeletonify watch ./src/components

# Watch with Tailwind
skeletonify watch ./src/components --style tailwind

# Verbose mode
skeletonify watch ./src/components --verbose
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --style <style>` | CSS output: `css` or `tailwind` | from config |
| `-o, --output <path>` | Output directory | from config |
| `-v, --verbose` | Show detailed output | `false` |

### Example Output

```
👀 Watching for changes...

  Source: ./src/components
  Style: css
  Output: ./src/skeletons

  🔍 Scanning for components...
  ✅ Initial generation: 5 skeletons created

  👀 Watching for changes... (Press Ctrl+C to stop)
```

### Behavior

- **File change**: Re-generates skeleton for that file
- **File added**: Generates skeleton for new file
- **File removed**: Shows notice (manual cleanup needed)
- **Initial run**: Generates all skeletons first

---

## `skeletonify init`

Create a `skeletonify.config.json` configuration file.

### Usage

```bash
skeletonify init
```

### Example Output

```
✅ Created skeletonify.config.json

  Configuration options:
    style:      "css" or "tailwind"
    output:     Output directory for skeletons
    animation:  "pulse", "shimmer", or "none"
    colors:     Primary and secondary skeleton colors
    patterns:   Custom dimensions for avatar, button, text

  Edit skeletonify.config.json to customize.
```

### Behavior

- Creates `skeletonify.config.json` in current directory
- Skips if file already exists (shows warning)

---

## Global Options

| Flag | Description |
|------|-------------|
| `-V, --version` | Output version number |
| `-h, --help` | Display help for command |
