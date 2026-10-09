/**
 * Input validation utilities for Auth API
 */

export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return 'Name is required.';
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return 'Name cannot be empty.';
  }
  if (trimmed.length > 100) {
    return 'Name must not exceed 100 characters.';
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return 'Email is required.';
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please provide a valid email address.';
  }
  return null;
};

/**
 * bcrypt truncates inputs at 72 bytes; rejecting longer passwords prevents both
 * silent truncation (two different passwords hashing identically) and abuse by
 * attackers sending multi-megabyte strings.
 */
export const MAX_PASSWORD_BYTES = 72;

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return `Password must not exceed ${MAX_PASSWORD_BYTES} bytes.`;
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
  }
  return null;
};

/**
 * Input validation utilities for Notes API
 */

export const validateNoteTitle = (title) => {
  if (!title || typeof title !== 'string') {
    return 'Note title is required.';
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return 'Note title cannot be empty.';
  }
  if (trimmed.length > 255) {
    return 'Note title must not exceed 255 characters.';
  }
  return null;
};

export const MAX_NOTE_CONTENT_LENGTH = 50000;

export const validateNoteContent = (content) => {
  if (!content || typeof content !== 'string') {
    return 'Note content is required.';
  }
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return 'Note content cannot be empty.';
  }
  if (trimmed.length > MAX_NOTE_CONTENT_LENGTH) {
    return `Note content must not exceed ${MAX_NOTE_CONTENT_LENGTH} characters.`;
  }
  return null;
};

export const validateNoteCategory = (category) => {
  if (!category || typeof category !== 'string') {
    return 'Note category is required.';
  }
  const validCategories = ['Personal', 'Work', 'Study', 'Ideas', 'Others'];
  if (!validCategories.includes(category.trim())) {
    return `Note category must be one of: ${validCategories.join(', ')}.`;
  }
  return null;
};
