import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'ol',
  'ul',
  'li',
  'blockquote',
  'pre',
  'code',
  'br',
  'a',
  'span',
  'div',
];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'title', 'target', 'rel'],
  span: ['class', 'style'],
  p: ['class', 'style'],
  div: ['class', 'style'],
  pre: ['class'],
};

const ALLOWED_STYLES = {
  '*': {
    color: [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/],
    'background-color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/],
    'text-align': [/^(left|right|center|justify)$/],
  },
};

/**
 * Sanitize rich-text (Quill) HTML before it is stored. Allows the subset of
 * formatting produced by the editor's toolbar and strips anything dangerous
 * (script, iframe, event handlers, javascript: URLs, etc.).
 */
export const sanitizeNoteHtml = (html) =>
  sanitizeHtml(typeof html === 'string' ? html : '', {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto'],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' },
      }),
    },
    disallowedTagsMode: 'discard',
  });

/**
 * Sanitize plain text (e.g. a note title): strips all HTML tags/entities and
 * returns only text content.
 */
export const sanitizePlainText = (text) =>
  sanitizeHtml(typeof text === 'string' ? text : '', {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });