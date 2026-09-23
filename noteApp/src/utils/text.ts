/**
 * Strip HTML tags and decode common entities from a string, returning plain text.
 * Used to render note content (which the web app stores as rich HTML) on native.
 */
export const stripHtml = (input = ""): string =>
  String(input ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

export const sanitizeHtml = (html = ""): string => String(html ?? "");
