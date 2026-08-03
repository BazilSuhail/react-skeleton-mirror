import { SkeletonType } from '../types';

interface Dimensions {
  width?: string;
  height?: string;
  isCircle?: boolean;
  isLayout?: boolean;
}

/**
 * Classifies a JSX element into a skeleton type.
 */
export function classifyElement(
  tagName: string,
  className?: string,
  text?: string,
  src?: string,
  alt?: string
): SkeletonType {
  const tag = tagName.toLowerCase();
  const cls = className || '';

  // Image detection
  if (tag === 'img') {
    // Check for avatar patterns in className or alt
    if (
      /\b(avatar|profile|user|icon)\b/i.test(cls) ||
      /\b(avatar|profile|user|icon)\b/i.test(alt || '')
    ) {
      return 'AVATAR';
    }
    return 'IMAGE';
  }

  // Heading
  if (/^h[1-6]$/.test(tag)) return 'HEADING';

  // Paragraph
  if (tag === 'p') return 'TEXT';

  // Span — check if it's inside a link or button
  if (tag === 'span') return 'TEXT';

  // Button
  if (tag === 'button') return 'BUTTON';

  // Input / Textarea
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'INPUT';

  // Link
  if (tag === 'a') return 'LINK';

  // SVG / Icon
  if (tag === 'svg' || tag === 'path' || tag === 'i') return 'ICON';

  // Check className for layout indicators
  if (cls) {
    // Flex or grid = container
    if (/\b(flex|grid|inline-flex|inline-grid)\b/.test(cls)) {
      return 'CONTAINER';
    }
    // Absolute/relative positioning = wrapper
    if (/\b(absolute|relative|fixed|sticky)\b/.test(cls)) {
      return 'WRAPPER';
    }
  }

  // If it has no className and no children, it's a wrapper
  return 'WRAPPER';
}

/**
 * Computes responsive dimensions for a skeleton element.
 * Uses approximate proportions that look good on all screen sizes.
 */
export function computeDimensions(
  type: SkeletonType,
  className?: string,
  style?: Record<string, string>,
  src?: string
): Dimensions {
  const cls = className || '';

  switch (type) {
    case 'AVATAR':
      return computeAvatarDimensions(cls, style);

    case 'IMAGE':
      return computeImageDimensions(cls, style);

    case 'HEADING':
      return computeHeadingDimensions(cls, style);

    case 'TEXT':
      return computeTextDimensions(cls, style);

    case 'BUTTON':
      return computeButtonDimensions(cls, style);

    case 'INPUT':
      return computeInputDimensions(cls, style);

    case 'LINK':
      return computeLinkDimensions(cls, style);

    case 'ICON':
      return computeIconDimensions(cls, style);

    case 'CONTAINER':
      return { isLayout: true };

    case 'WRAPPER':
      return {};

    default:
      return {};
  }
}

function computeAvatarDimensions(
  cls: string,
  style?: Record<string, string>
): Dimensions {
  // Check for size classes
  if (/\b(w-8|h-8|text-xs)\b/.test(cls)) {
    return { width: '32px', height: '32px', isCircle: true };
  }
  if (/\b(w-10|h-10|text-sm)\b/.test(cls)) {
    return { width: '40px', height: '40px', isCircle: true };
  }
  if (/\b(w-16|h-16|text-lg)\b/.test(cls)) {
    return { width: '64px', height: '64px', isCircle: true };
  }
  if (/\b(w-20|h-20|text-xl)\b/.test(cls)) {
    return { width: '80px', height: '80px', isCircle: true };
  }
  if (/\b(w-24|h-24|text-2xl)\b/.test(cls)) {
    return { width: '96px', height: '96px', isCircle: true };
  }

  // Check style object
  if (style?.width && style?.height) {
    return {
      width: style.width,
      height: style.height,
      isCircle: /\brounded-full\b/.test(cls),
    };
  }

  // Default avatar size
  return { width: '48px', height: '48px', isCircle: true };
}

function computeImageDimensions(
  cls: string,
  style?: Record<string, string>
): Dimensions {
  // Check for aspect ratio classes
  if (/\b(aspect-video|aspect-\[16\/9\])\b/.test(cls)) {
    return { width: '100%', height: 'auto' };
  }
  if (/\b(aspect-square|aspect-\[1\/1\])\b/.test(cls)) {
    return { width: '100%', height: 'auto' };
  }

  // Check for fixed sizes in Tailwind
  const wMatch = cls.match(/\b(w-(\d+))\b/);
  const hMatch = cls.match(/\b(h-(\d+))\b/);

  if (wMatch && hMatch) {
    return {
      width: `${parseInt(wMatch[2]) * 4}px`,
      height: `${parseInt(hMatch[2]) * 4}px`,
    };
  }

  // Default: responsive width
  return { width: '100%', height: 'auto' };
}

function computeHeadingDimensions(
  cls: string,
  _style?: Record<string, string>
): Dimensions {
  // Headings are shorter than full width
  if (/\b(w-full)\b/.test(cls)) {
    return { width: '100%', height: undefined };
  }

  // Check for specific width classes
  if (/\b(w-1\/2|w-1\/3)\b/.test(cls)) {
    return { width: undefined, height: undefined };
  }

  // Default heading widths by level (approximation)
  return { width: '65%', height: undefined };
}

function computeTextDimensions(
  cls: string,
  _style?: Record<string, string>
): Dimensions {
  // Full width text
  if (/\b(w-full)\b/.test(cls)) {
    return { width: '100%', height: undefined };
  }

  // Short text (like badges, labels)
  if (/\b(w-auto|inline)\b/.test(cls)) {
    return { width: '40%', height: undefined };
  }

  // Default: full width for paragraphs, variable for spans
  return { width: '100%', height: undefined };
}

function computeButtonDimensions(
  cls: string,
  _style?: Record<string, string>
): Dimensions {
  // Check for size classes
  if (/\b(px-2|py-1|text-xs)\b/.test(cls)) {
    return { width: '80px', height: '32px' };
  }
  if (/\b(px-4|py-2|text-sm)\b/.test(cls)) {
    return { width: '100px', height: '36px' };
  }
  if (/\b(px-6|py-3|text-lg)\b/.test(cls)) {
    return { width: '140px', height: '48px' };
  }

  // Full width button
  if (/\b(w-full)\b/.test(cls)) {
    return { width: '100%', height: '44px' };
  }

  // Default button
  return { width: '120px', height: '40px' };
}

function computeInputDimensions(
  cls: string,
  _style?: Record<string, string>
): Dimensions {
  // Full width input (most common)
  if (/\b(w-full)\b/.test(cls) || !/\bw-\d+\b/.test(cls)) {
    return { width: '100%', height: '40px' };
  }

  // Half width
  if (/\b(w-1\/2)\b/.test(cls)) {
    return { width: '50%', height: '40px' };
  }

  return { width: '100%', height: '40px' };
}

function computeLinkDimensions(
  _cls: string,
  _style?: Record<string, string>
): Dimensions {
  // Links are short
  return { width: '30%', height: undefined };
}

function computeIconDimensions(
  cls: string,
  _style?: Record<string, string>
): Dimensions {
  // Check for size classes
  if (/\b(w-4|h-4|text-xs)\b/.test(cls)) {
    return { width: '16px', height: '16px' };
  }
  if (/\b(w-5|h-5|text-sm)\b/.test(cls)) {
    return { width: '20px', height: '20px' };
  }
  if (/\b(w-6|h-6|text-base)\b/.test(cls)) {
    return { width: '24px', height: '24px' };
  }
  if (/\b(w-8|h-8|text-lg)\b/.test(cls)) {
    return { width: '32px', height: '32px' };
  }

  // Default icon
  return { width: '24px', height: '24px' };
}
