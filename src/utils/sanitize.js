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

/** Batch check required fields -- returns array of missing field names */
function validateRequired(fields) {
  var missing = [];
  for (var key in fields) {
    var val = fields[key];
    if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
      missing.push(key);
    }
  }
  return missing;
}

module.exports = {
  isValidEmail: isValidEmail,
  sanitizeText: sanitizeText,
  validateRequired: validateRequired,
};
