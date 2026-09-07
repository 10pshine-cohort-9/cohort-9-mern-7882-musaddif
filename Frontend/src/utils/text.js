import DOMPurify from 'dompurify';

/**
 * Strip HTML tags and decode entities from a string, returning plain text.
 * @param {string} html
 * @returns {string}
 */
export const stripHtml = (html = '') => {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ');
  }
  const element = document.createElement('div');
  element.innerHTML = html;
  return (element.textContent || element.innerText || '').replace(/\s+/g, ' ').trim();
};

/**
 * Sanitize HTML using DOMPurify before rendering or persisting.
 * @param {string} html
 * @returns {string}
 */
export const sanitizeHtml = (html = '') => DOMPurify.sanitize(html);