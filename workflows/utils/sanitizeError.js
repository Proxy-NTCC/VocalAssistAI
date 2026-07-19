/**
 * Sanitizes and truncates error messages to prevent database bloat and API key leaks.
 *
 * @param {any} error - The caught error object or string.
 * @param {number} [maxLength=500] - Max characters to retain in the log.
 * @returns {string} Clean, sanitized error message.
 */
function sanitizeError(error, maxLength = 500) {
  if (!error) {
    return 'Unknown system error occurred.';
  }

  let rawMessage = '';
  
  try {
    if (typeof error === 'string') {
      rawMessage = error;
    } else if (typeof error === 'object') {
      // Pull message, stack, or stringified representation
      rawMessage = error.message || error.stack || JSON.stringify(error);
    } else {
      rawMessage = String(error);
    }
  } catch (e) {
    return 'Failed to serialize system error details.';
  }

  let sanitized = rawMessage;

  // 1. Scrub OpenAI API Keys (sk-...)
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{48}/g, '[REDACTED_OPENAI_KEY]');

  // 2. Scrub Google/Gemini API Keys (AIzaSy...)
  sanitized = sanitized.replace(/AIzaSy[a-zA-Z0-9-_]{33}/g, '[REDACTED_GEMINI_KEY]');

  // 3. Scrub Bearer Tokens
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9\-_\.\~]+/gi, 'Bearer [REDACTED_TOKEN]');

  // 4. Scrub Meta/WhatsApp Access Tokens (very long strings)
  sanitized = sanitized.replace(/EA[a-zA-Z0-9]+(?=\s|&|$)/g, '[REDACTED_META_ACCESS_TOKEN]');

  // 5. Clean passwords or secret params from query strings/payloads
  sanitized = sanitized.replace(/password=[a-zA-Z0-9@#$%^&*()_+=-]+/gi, 'password=[REDACTED]');
  sanitized = sanitized.replace(/api[-_]?key=[a-zA-Z0-9-_]+/gi, 'apiKey=[REDACTED]');

  // 6. Truncate to prevent Airtable field overflow and retain readability
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 15) + '... [TRUNCATED]';
  }

  return sanitized.trim();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sanitizeError };
}
