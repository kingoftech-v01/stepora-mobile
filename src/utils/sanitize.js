/**
 * Stepora Mobile -- Input validation and sanitization utilities.
 * Mirrors the web app's utils/sanitize.js.
 */

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function sanitizeText(text, maxLen) {
  if (!text || typeof text !== 'string') return '';
  var clean = text.replace(/[<>"'`;\\]/g, '').trim();
  if (maxLen && clean.length > maxLen) clean = clean.substring(0, maxLen);
  return clean;
}

module.exports = {
  isValidEmail: isValidEmail,
  sanitizeText: sanitizeText,
};
