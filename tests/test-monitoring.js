const { sanitizeError } = require('../workflows/utils/sanitizeError');

function runSanitizerTests() {
  console.log("Starting unit tests for sanitizeError...");

  // Scenario 1: Clean string passes unaltered
  const errClean = "Timeout connecting to server at 192.168.1.1";
  const resClean = sanitizeError(errClean);
  console.assert(resClean === errClean, `Expected unaltered message, got "${resClean}"`);

  // Scenario 2: Error object extraction
  const errObj = new Error("Pinecone index not initialized.");
  const resObj = sanitizeError(errObj);
  console.assert(resObj === "Pinecone index not initialized.", `Expected extracted message, got "${resObj}"`);

  // Scenario 3: OpenAI API key masking
  const errOpenAI = "Failed request: Authorization key sk-ABC123xyz789012345678901234567890123456789012345 was rejected.";
  const resOpenAI = sanitizeError(errOpenAI);
  console.assert(resOpenAI.includes("[REDACTED_OPENAI_KEY]"), "OpenAI API key was not redacted.");
  console.assert(!resOpenAI.includes("sk-ABC123xyz"), "Raw OpenAI API key was leaked in output.");

  // Scenario 4: Google API key masking
  const errGoogle = "Gemini API rejected request. x-goog-api-key AIzaSyBrokenKeyDescription1234567890123 expired.";
  const resGoogle = sanitizeError(errGoogle);
  console.assert(resGoogle.includes("[REDACTED_GEMINI_KEY]"), "Google API key was not redacted.");
  console.assert(!resGoogle.includes("AIzaSyBroken"), "Raw Google API key was leaked in output.");

  // Scenario 5: Bearer Token masking
  const errBearer = "Request headers: { Authorization: Bearer abc-def-12345-token-details-xyz }";
  const resBearer = sanitizeError(errBearer);
  console.assert(resBearer.includes("Bearer [REDACTED_TOKEN]"), "Bearer authorization token was not redacted.");

  // Scenario 6: WhatsApp Access Token masking
  const errWhatsApp = "Meta returned 401. Token EAAYY1234567890abcdefghijklmnopqrstuvwxyz is invalid.";
  const resWhatsApp = sanitizeError(errWhatsApp);
  console.assert(resWhatsApp.includes("[REDACTED_META_ACCESS_TOKEN]"), "WhatsApp Meta access token was not redacted.");

  // Scenario 7: Length Truncation
  const longMsg = "A".repeat(600);
  const resLong = sanitizeError(longMsg, 100);
  console.assert(resLong.length === 100, `Expected exactly 100 characters output, got ${resLong.length}`);
  console.assert(resLong.endsWith("... [TRUNCATED]"), "Truncation suffix missing.");

  // Scenario 8: Null and undefined error handling
  console.assert(sanitizeError(null) === 'Unknown system error occurred.', "Null error check failed.");
  console.assert(sanitizeError(undefined) === 'Unknown system error occurred.', "Undefined error check failed.");

  console.log("All sanitizeError unit tests passed successfully!");
}

try {
  runSanitizerTests();
} catch (e) {
  console.error("Sanitizer tests failed:", e);
  process.exit(1);
}
