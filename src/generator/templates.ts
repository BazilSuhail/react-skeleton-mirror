// Skeleton element templates for code generation

export interface ElementTemplate {
  tag: string;
  className: string;
  style: string;
  selfClosing: boolean;
}

// CSS mode templates
export const CSS_TEMPLATES: Record<string, ElementTemplate> = {
  IMAGE: {
    tag: 'div',
    className: 'skeleton-avatar',
    style: '',
    selfClosing: true,
  },
  HEADING: {
    tag: 'div',
    className: 'skeleton-text skeleton-heading',
    style: "style={{ width: '70%' }}",
    selfClosing: true,
  },
  TEXT: {
    tag: 'div',
    className: 'skeleton-text',
    style: "style={{ width: '100%' }}",
    selfClosing: true,
  },
  BUTTON: {
    tag: 'div',
    className: 'skeleton-button',
    style: "style={{ width: '120px' }}",
    selfClosing: true,
  },
  INPUT: {
    tag: 'div',
    className: 'skeleton-input',
    style: '',
    selfClosing: true,
  },
  LINK: {
    tag: 'div',
    className: 'skeleton-text skeleton-link',
    style: "style={{ width: '30%' }}",
    selfClosing: true,
  },
  CONTAINER: {
    tag: 'div',
    className: 'skeleton-container',
    style: '',
    selfClosing: false,
  },
  WRAPPER: {
    tag: 'div',
    className: 'skeleton-wrapper',
    style: '',
    selfClosing: false,
  },
};

// Tailwind mode templates
export const TAILWIND_TEMPLATES: Record<string, ElementTemplate> = {
  IMAGE: {
    tag: 'div',
    className: 'bg-gray-300 rounded-full animate-pulse',
    style: "style={{ width: 48, height: 48 }}",
    selfClosing: true,
  },
  HEADING: {
    tag: 'div',
    className: 'bg-gray-300 rounded animate-pulse',
    style: "style={{ width: '70%', height: 24 }}",
    selfClosing: true,
  },
  TEXT: {
    tag: 'div',
    className: 'bg-gray-300 rounded animate-pulse',
    style: "style={{ width: '100%', height: 14 }}",
    selfClosing: true,
  },
  BUTTON: {
    tag: 'div',
    className: 'bg-gray-300 rounded-lg animate-pulse',
    style: "style={{ width: 120, height: 40 }}",
    selfClosing: true,
  },
  INPUT: {
    tag: 'div',
    className: 'bg-gray-300 rounded animate-pulse w-full',
    style: "style={{ height: 40 }}",
    selfClosing: true,
  },
  LINK: {
    tag: 'div',
    className: 'bg-gray-300 rounded animate-pulse',
    style: "style={{ width: '30%', height: 14 }}",
    selfClosing: true,
  },
  CONTAINER: {
    tag: 'div',
    className: '',
    style: '',
    selfClosing: false,
  },
  WRAPPER: {
    tag: 'div',
    className: '',
    style: '',
    selfClosing: false,
  },
};
