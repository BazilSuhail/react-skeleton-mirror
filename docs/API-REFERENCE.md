# API Reference

## TypeScript Interfaces

### SkeletonElement

```typescript
interface SkeletonElement {
  type: SkeletonType;
  tagName: string;
  className?: string;
  style?: Record<string, string>;
  text?: string;
  width?: string;
  height?: string;
  isCircle?: boolean;
  isLayout?: boolean;
  children: SkeletonElement[];
}
```

### SkeletonType

```typescript
type SkeletonType =
  | 'IMAGE'
  | 'HEADING'
  | 'TEXT'
  | 'BUTTON'
  | 'INPUT'
  | 'LINK'
  | 'ICON'
  | 'AVATAR'
  | 'CONTAINER'
  | 'WRAPPER';
```

### ImportInfo

```typescript
interface ImportInfo {
  componentName: string;
  sourcePath: string;
  isDefault: boolean;
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  filePath: string;
  componentName: string;
  isClientComponent: boolean;
  framework: 'react' | 'nextjs-app' | 'nextjs-pages';
  elements: SkeletonElement[];
  subComponents: AnalysisResult[];
  imports: ImportInfo[];
}
```

### GenerateOptions

```typescript
interface GenerateOptions {
  style?: 'css' | 'tailwind';
  output?: string;
  tests: boolean;
}
```

### WatchOptions

```typescript
interface WatchOptions {
  style?: 'css' | 'tailwind';
  output?: string;
}
```

### SkeletonConfig

```typescript
interface SkeletonConfig {
  style: 'css' | 'tailwind';
  output: string;
  animation: 'pulse' | 'shimmer' | 'none';
  colors: {
    primary: string;
    secondary: string;
  };
  patterns: {
    avatar: { width: number; height: number; circle: boolean };
    button: { height: number; borderRadius: number };
    text: { height: number; margin: string };
  };
}
```

### ResolvedConfig

```typescript
interface ResolvedConfig extends SkeletonConfig {
  verbose: boolean;
}
```

---

## Parser Functions

### parseComponent

```typescript
async function parseComponent(filePath: string): Promise<AnalysisResult>
```

Parses a React component file and returns analysis results.

**Parameters:**
- `filePath` — Path to the component file

**Returns:**
- `AnalysisResult` with extracted elements, imports, and metadata

**Throws:**
- `Error` if parsing fails

---

## Classifier Functions

### classifyElement

```typescript
function classifyElement(
  tagName: string,
  className?: string,
  text?: string,
  src?: string,
  alt?: string
): SkeletonType
```

Classifies a JSX element into a skeleton type.

### computeDimensions

```typescript
function computeDimensions(
  type: SkeletonType,
  className?: string,
  style?: Record<string, string>,
  src?: string
): Dimensions
```

Computes responsive dimensions for a skeleton element.

---

## Resolver Functions

### resolveImports

```typescript
async function resolveImports(
  imports: ImportInfo[],
  currentFilePath: string
): Promise<AnalysisResult[]>
```

Resolves imported components and recursively analyzes them.

### resetResolver

```typescript
function resetResolver(): void
```

Resets the analyzed files set for fresh runs.

---

## Framework Functions

### detectFramework

```typescript
function detectFramework(
  filePath: string
): 'react' | 'nextjs-app' | 'nextjs-pages'
```

Detects the framework based on file path patterns.

### isPageOrLayout

```typescript
function isPageOrLayout(filePath: string): boolean
```

Checks if a file is a page or layout component.

### isRouteHandler

```typescript
function isRouteHandler(filePath: string): boolean
```

Checks if a file is a route handler.

---

## Generator Functions

### generateSkeletonTSX

```typescript
function generateSkeletonTSX(
  result: AnalysisResult,
  style: 'css' | 'tailwind'
): string
```

Generates a skeleton TSX component file.

### renderCSSElement

```typescript
function renderCSSElement(
  element: SkeletonElement,
  indent?: number
): string
```

Renders a skeleton element tree to JSX string (CSS mode).

### renderTailwindElement

```typescript
function renderTailwindElement(
  element: SkeletonElement,
  indent?: number
): string
```

Renders a skeleton element tree to JSX string (Tailwind mode).

### generateCSS

```typescript
function generateCSS(
  animation?: 'pulse' | 'shimmer' | 'none'
): string
```

Generates the full CSS file content.

---

## Config Functions

### loadConfig

```typescript
async function loadConfig(): Promise<SkeletonConfig>
```

Loads the skeletonify config file from the project root.

### resolveConfig

```typescript
function resolveConfig(
  baseConfig: SkeletonConfig,
  cliOptions: Partial<GenerateOptions | WatchOptions>,
  verbose?: boolean
): ResolvedConfig
```

Resolves the final config by merging defaults, config file, and CLI flags.

### validateConfig

```typescript
function validateConfig(
  config: Partial<SkeletonConfig>
): string[]
```

Validates a config object and returns any errors found.

### printConfig

```typescript
function printConfig(config: ResolvedConfig): void
```

Prints the resolved config in verbose mode.

---

## Command Functions

### analyze

```typescript
async function analyze(
  targetPath: string,
  verbose?: boolean
): Promise<void>
```

Analyzes React components and prints suggestions.

### generate

```typescript
async function generate(
  targetPath: string,
  options: GenerateOptions,
  verbose?: boolean
): Promise<void>
```

Generates skeleton component files.

### watch

```typescript
async function watch(
  targetPath: string,
  options: WatchOptions,
  verbose?: boolean
): Promise<void>
```

Watches components and auto-regenerates skeletons.

### init

```typescript
async function init(): Promise<void>
```

Creates a skeletonify.config.json file.

---

## File Structure

```
src/
├── cli.ts                    # CLI entry point
├── types.ts                  # TypeScript interfaces
├── analyzer/
│   ├── parser.ts             # AST parser
│   ├── classifier.ts         # Element classifier
│   ├── resolver.ts           # Import resolver
│   └── framework.ts          # Framework detector
├── generator/
│   ├── templates.ts          # CSS/Tailwind renderer
│   └── tsx.ts                # TSX generator
├── commands/
│   ├── analyze.ts            # Analyze command
│   ├── generate.ts           # Generate command
│   ├── watch.ts              # Watch command
│   └── init.ts               # Init command
└── config/
    ├── index.ts              # Config loader
    └── defaults.ts           # Default values
```
