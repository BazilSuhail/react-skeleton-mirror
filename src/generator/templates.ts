import { SkeletonElement, SkeletonType } from '../types';

interface RenderedElement {
  tag: string;
  className: string;
  style: string;
  selfClosing: boolean;
  children: RenderedElement[];
  indent: number;
}

/**
 * Renders a SkeletonElement tree into a JSX string for CSS mode.
 * Uses skeleton-* class names that will be defined in the CSS file.
 */
export function renderCSSElement(
  element: SkeletonElement,
  indent: number = 0
): string {
  const pad = '  '.repeat(indent);

  switch (element.type) {
    case 'AVATAR':
    case 'IMAGE':
      return renderLeaf('div', getSkeletonClass(element), getInlineStyle(element), indent, true);

    case 'HEADING':
      return renderLeaf('div', getSkeletonClass(element), getInlineStyle(element), indent, true);

    case 'TEXT':
      if (element.children.length > 0) {
        const kids = element.children.map((c) => renderCSSElement(c, indent + 1)).join('\n');
        return `${pad}<div className="${getSkeletonClass(element)}">\n${kids}\n${pad}</div>`;
      }
      return renderLeaf('div', getSkeletonClass(element), getInlineStyle(element), indent, true);

    case 'BUTTON':
      return renderLeaf('div', getSkeletonClass(element), getInlineStyle(element), indent, true);

    case 'INPUT':
      return renderLeaf('div', getSkeletonClass(element), getInlineStyle(element), indent, true);

    case 'LINK':
      return renderLeaf('div', getSkeletonClass(element), getInlineStyle(element), indent, true);

    case 'ICON':
      return renderLeaf('div', getSkeletonClass(element), getInlineStyle(element), indent, true);

    case 'CONTAINER':
    case 'WRAPPER': {
      const kids = element.children.map((c) => renderCSSElement(c, indent + 1)).join('\n');
      if (kids) {
        return `${pad}<div className="${getSkeletonClass(element)}">\n${kids}\n${pad}</div>`;
      }
      return renderLeaf('div', getSkeletonClass(element), '', indent, false);
    }

    default:
      return renderLeaf('div', 'skeleton-wrapper', '', indent, false);
  }
}

/**
 * Renders a SkeletonElement tree into a JSX string for Tailwind mode.
 * Uses inline Tailwind classes directly.
 */
export function renderTailwindElement(
  element: SkeletonElement,
  indent: number = 0
): string {
  const pad = '  '.repeat(indent);

  switch (element.type) {
    case 'AVATAR':
      return renderLeaf(
        'div',
        getTailwindClasses(element),
        getInlineStyle(element),
        indent,
        true
      );

    case 'IMAGE':
      return renderLeaf(
        'div',
        getTailwindClasses(element),
        getInlineStyle(element),
        indent,
        true
      );

    case 'HEADING':
      return renderLeaf(
        'div',
        getTailwindClasses(element),
        getInlineStyle(element),
        indent,
        true
      );

    case 'TEXT':
      if (element.children.length > 0) {
        const kids = element.children.map((c) => renderTailwindElement(c, indent + 1)).join('\n');
        return `${pad}<div className="${getTailwindClasses(element)}">\n${kids}\n${pad}</div>`;
      }
      return renderLeaf(
        'div',
        getTailwindClasses(element),
        getInlineStyle(element),
        indent,
        true
      );

    case 'BUTTON':
      return renderLeaf(
        'div',
        getTailwindClasses(element),
        getInlineStyle(element),
        indent,
        true
      );

    case 'INPUT':
      return renderLeaf(
        'div',
        getTailwindClasses(element),
        getInlineStyle(element),
        indent,
        true
      );

    case 'LINK':
      return renderLeaf(
        'div',
        getTailwindClasses(element),
        getInlineStyle(element),
        indent,
        true
      );

    case 'ICON':
      return renderLeaf(
        'div',
        getTailwindClasses(element),
        getInlineStyle(element),
        indent,
        true
      );

    case 'CONTAINER': {
      const kids = element.children.map((c) => renderTailwindElement(c, indent + 1)).join('\n');
      const layoutClasses = getLayoutClasses(element);
      if (kids) {
        return `${pad}<div className="${layoutClasses}">\n${kids}\n${pad}</div>`;
      }
      return renderLeaf('div', layoutClasses, '', indent, false);
    }

    case 'WRAPPER': {
      const kids = element.children.map((c) => renderTailwindElement(c, indent + 1)).join('\n');
      if (kids) {
        return `${pad}<div className="${getLayoutClasses(element)}">\n${kids}\n${pad}</div>`;
      }
      return renderLeaf('div', getLayoutClasses(element), '', indent, false);
    }

    default:
      return renderLeaf('div', '', '', indent, false);
  }
}

function renderLeaf(
  tag: string,
  className: string,
  style: string,
  indent: number,
  selfClosing: boolean
): string {
  const pad = '  '.repeat(indent);
  const classAttr = className ? ` className="${className}"` : '';
  const styleAttr = style ? ` ${style}` : '';

  if (selfClosing) {
    return `${pad}<${tag}${classAttr}${styleAttr} />`;
  }
  return `${pad}<${tag}${classAttr}${styleAttr}></${tag}>`;
}

function getSkeletonClass(element: SkeletonElement): string {
  const classes: string[] = ['skeleton'];

  switch (element.type) {
    case 'AVATAR':
      classes.push('skeleton-avatar');
      if (element.isCircle) classes.push('skeleton-circle');
      break;
    case 'IMAGE':
      classes.push('skeleton-image');
      break;
    case 'HEADING':
      classes.push('skeleton-text', 'skeleton-heading');
      break;
    case 'TEXT':
      classes.push('skeleton-text');
      break;
    case 'BUTTON':
      classes.push('skeleton-button');
      break;
    case 'INPUT':
      classes.push('skeleton-input');
      break;
    case 'LINK':
      classes.push('skeleton-text', 'skeleton-link');
      break;
    case 'ICON':
      classes.push('skeleton-icon');
      break;
    case 'CONTAINER':
      classes.push('skeleton-container');
      break;
    case 'WRAPPER':
      classes.push('skeleton-wrapper');
      break;
  }

  return classes.join(' ');
}

function getInlineStyle(element: SkeletonElement): string {
  const parts: string[] = [];

  if (element.width) {
    parts.push(`width: '${element.width}'`);
  }
  if (element.height) {
    parts.push(`height: '${element.height}'`);
  }

  if (parts.length === 0) return '';
  return `style={{ ${parts.join(', ')} }}`;
}

function getTailwindClasses(element: SkeletonElement): string {
  const classes: string[] = [];

  // Base color
  classes.push('bg-gray-300');

  // Animation
  classes.push('animate-pulse');

  // Shape
  if (element.isCircle) {
    classes.push('rounded-full');
  } else {
    classes.push('rounded');
  }

  // Size from computed dimensions
  if (element.width) {
    const tw = convertToTailwindWidth(element.width);
    if (tw) classes.push(tw);
  }
  if (element.height) {
    const th = convertToTailwindHeight(element.height);
    if (th) classes.push(th);
  }

  return classes.join(' ');
}

function getLayoutClasses(element: SkeletonElement): string {
  const classesSet = new Set<string>();

  if (element.className) {
    // Extract layout-relevant classes from the original className
    const layoutPatterns = /\b(flex|grid|inline-flex|inline-grid|flex-col|flex-row|flex-wrap|gap-\d+|space-\w+|items-\w+|justify-\w+|grid-cols-\d+|col-span-\d+|p-\d+|px-\d+|py-\d+|m-\d+|mx-\d+|my-\d+|rounded|rounded-\w+|shadow|shadow-\w+)\b/g;
    const matches = element.className.match(layoutPatterns);
    if (matches) {
      for (const m of matches) {
        classesSet.add(m);
      }
    }
  }

  // Add flex if the original was a container but no flex classes found
  if (element.type === 'CONTAINER' && !Array.from(classesSet).some(c => c.startsWith('flex') || c.startsWith('grid'))) {
    classesSet.add('flex');
  }

  return Array.from(classesSet).join(' ');
}

function convertToTailwindWidth(width: string): string {
  // Fixed pixel values
  const pxMatch = width.match(/^(\d+)px$/);
  if (pxMatch) {
    const px = parseInt(pxMatch[1]);
    const rem = px / 4;
    return `w-[${px}px]`;
  }

  // Percentage values
  if (width === '100%') return 'w-full';
  if (width === '75%' || width === '70%') return 'w-3/4';
  if (width === '50%') return 'w-1/2';
  if (width === '33%' || width === '30%') return 'w-1/3';
  if (width === '25%') return 'w-1/4';

  // Tailwind default sizes
  if (width === '32px') return 'w-8';
  if (width === '40px') return 'w-10';
  if (width === '48px') return 'w-12';
  if (width === '64px') return 'w-16';
  if (width === '80px') return 'w-20';
  if (width === '96px') return 'w-24';
  if (width === '120px') return 'w-30';

  return `w-[${width}]`;
}

function convertToTailwindHeight(height: string): string {
  const pxMatch = height.match(/^(\d+)px$/);
  if (pxMatch) {
    const px = parseInt(pxMatch[1]);
    return `h-[${px}px]`;
  }

  if (height === '14px') return 'h-3.5';
  if (height === '16px') return 'h-4';
  if (height === '20px') return 'h-5';
  if (height === '24px') return 'h-6';
  if (height === '32px') return 'h-8';
  if (height === '36px') return 'h-9';
  if (height === '40px') return 'h-10';
  if (height === '48px') return 'h-12';
  if (height === '64px') return 'h-16';

  return `h-[${height}]`;
}

/**
 * Generates the full CSS file content for skeleton styles.
 * @param animation - The animation type: 'pulse', 'shimmer', or 'none'
 */
export function generateCSS(animation: 'pulse' | 'shimmer' | 'none' = 'pulse'): string {
  const animationCSS = getAnimationCSS(animation);

  return `/* Generated by react-skeleton-mirror */
/* https://github.com/BazilSuhail/react-skeleton-mirror */

.skeleton {
  background: #e5e7eb;
  border-radius: 4px;
}

.skeleton-circle {
  border-radius: 50%;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #d1d5db;
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #d1d5db;
  border-radius: 8px;
}

.skeleton-text {
  height: 16px;
  background: #d1d5db;
  border-radius: 4px;
  margin: 8px 0;
}

.skeleton-heading {
  height: 24px;
  width: 65%;
  margin-bottom: 12px;
}

.skeleton-button {
  height: 40px;
  width: 120px;
  background: #d1d5db;
  border-radius: 6px;
}

.skeleton-input {
  height: 40px;
  width: 100%;
  background: #d1d5db;
  border-radius: 6px;
}

.skeleton-link {
  height: 14px;
  width: 30%;
}

.skeleton-icon {
  width: 24px;
  height: 24px;
  background: #d1d5db;
  border-radius: 4px;
}

.skeleton-container {
  display: flex;
  flex-direction: column;
}

.skeleton-wrapper {
  display: flex;
  flex-direction: column;
}

${animationCSS}
`;
}

function getAnimationCSS(animation: 'pulse' | 'shimmer' | 'none'): string {
  if (animation === 'none') return '';

  if (animation === 'shimmer') {
    return `/* Shimmer animation */
.skeleton,
.skeleton-avatar,
.skeleton-image,
.skeleton-text,
.skeleton-heading,
.skeleton-button,
.skeleton-input,
.skeleton-link,
.skeleton-icon {
  position: relative;
  overflow: hidden;
  background: #e5e7eb;
}

.skeleton::after,
.skeleton-avatar::after,
.skeleton-image::after,
.skeleton-text::after,
.skeleton-heading::after,
.skeleton-button::after,
.skeleton-input::after,
.skeleton-link::after,
.skeleton-icon::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}`;
  }

  // Default: pulse
  return `/* Pulse animation */
.skeleton,
.skeleton-avatar,
.skeleton-image,
.skeleton-text,
.skeleton-heading,
.skeleton-button,
.skeleton-input,
.skeleton-link,
.skeleton-icon {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}`;
}
