import DOMPurify from 'dompurify';

/**
 * Strip HTML tags and decode entities from a string, returning plain text.
 * Input is sanitized with DOMPurify first so malicious markup never hits the
 * DOM parser.
 * @param {string} html
 * @returns {string}
 */
export const stripHtml = (html = '') => {
  if (typeof document === 'undefined') {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).replace(/\s+/g, ' ').trim();
  }
  const clean = DOMPurify.sanitize(html);
  const element = document.createElement('div');
  element.innerHTML = clean;
  return (element.textContent || element.innerText || '').replace(/\s+/g, ' ').trim();
};

/**
 * Sanitize HTML using DOMPurify before rendering or persisting.
 * @param {string} html
 * @returns {string}
 */
export const sanitizeHtml = (html = '') => DOMPurify.sanitize(html);