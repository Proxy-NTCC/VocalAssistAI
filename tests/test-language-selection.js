const { resolveAndInterpolate } = require('../workflows/utils/interpolateTemplate');

// Mock tickets
const mockTickets = [
  {
    language: "Hindi",
    rawMessage: "मुझे टूटा हुआ सामान मिला है, रिफंड चाहिए।",
    translation: "I received broken items, I want a refund."
  },
  {
    language: "Hinglish",
    rawMessage: "Mera payment deduct ho gaya par transaction pending show kar raha hai.",
    translation: "My payment was deducted but the transaction is showing as pending."
  },
  {
    language: "English",
    rawMessage: "I want to change the delivery address for my order #99887.",
    translation: "I want to change the delivery address for my order #99887."
  },
  {
    language: null, // Detection failure
    rawMessage: "அகௌன்ட் லாகின் செய்ய முடியவில்லை.", // Tamil
    translation: null // Missing translation
  }
];

function runLanguageSelectionTests() {
  console.log("Starting vernacular language configuration tests...");

  // Test 1: Native Hindi (Devanagari Script)
  const billingHindi = resolveAndInterpolate("Billing & Payment", null, {
    Language: mockTickets[0].language,
    RawMessage: mockTickets[0].rawMessage,
    Translation: mockTickets[0].translation,
    SimilarTickets: "*No similar tickets found.*"
  });

  console.assert(
    billingHindi.userPrompt.includes("Preferred Language: Hindi"),
    "Hindi preferred language injection failed."
  );
  console.assert(
    billingHindi.userPrompt.includes("Devanagari for Hindi"),
    "Hindi script instruction missing."
  );

  // Test 2: Hinglish (Roman Script)
  const billingHinglish = resolveAndInterpolate("Billing & Payment", null, {
    Language: mockTickets[1].language,
    RawMessage: mockTickets[1].rawMessage,
    Translation: mockTickets[1].translation,
    SimilarTickets: "*No similar tickets found.*"
  });

  console.assert(
    billingHinglish.userPrompt.includes("Preferred Language: Hinglish"),
    "Hinglish language injection failed."
  );
  console.assert(
    billingHinglish.userPrompt.includes("Romanized Hindi (using the English alphabet"),
    "Hinglish script instructions missing."
  );

  // Test 3: Standard English
  const shippingEnglish = resolveAndInterpolate("Delivery & Shipping", null, {
    Language: mockTickets[2].language,
    RawMessage: mockTickets[2].rawMessage,
    Translation: mockTickets[2].translation,
    SimilarTickets: "*No similar tickets found.*"
  });

  console.assert(
    shippingEnglish.userPrompt.includes("Preferred Language: English"),
    "English language injection failed."
  );
  console.assert(
    shippingEnglish.userPrompt.includes("write the response in English"),
    "English script instructions missing."
  );

  // Test 4: Detection Failure Fallback
  const otherFallback = resolveAndInterpolate("Other", null, {
    Language: mockTickets[3].language, // null
    RawMessage: mockTickets[3].rawMessage,
    Translation: mockTickets[3].translation,
    SimilarTickets: "*No similar tickets found.*"
  });

  // Verify it defaults to English
  console.assert(
    otherFallback.userPrompt.includes("Customer Preferred Language: English"),
    "Preferred Language should fallback to English when null."
  );
  console.assert(
    otherFallback.userPrompt.includes("write the response in English"),
    "Script instruction should fallback to English when language is missing."
  );

  console.log("Vernacular prompt configurations and fallback logic verified successfully!");
}

try {
  runLanguageSelectionTests();
} catch (e) {
  console.error("Vernacular prompt test execution failed:", e);
  process.exit(1);
}
