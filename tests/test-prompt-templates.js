const { resolveAndInterpolate } = require('../workflows/utils/interpolateTemplate');

// Mock data: Airtable template rows
const mockAirtableTemplates = [
  {
    id: "recTpl1",
    fields: {
      Topic: "Billing & Payment",
      "System Instructions": "Airtable Billing System: Help customer with money.",
      "User Prompt Template": "Airtable User Prompt: Msg is {{RawMessage}}, Lang is {{Language}}, Similar:\n{{SimilarTickets}}",
      Active: true
    }
  },
  {
    id: "recTpl2",
    fields: {
      Topic: "Product Issue",
      "System Instructions": "Airtable Product System: Help with damaged items.",
      "User Prompt Template": "Airtable User Prompt: Damaged product: {{RawMessage}}",
      Active: false // Inactive, should be skipped and fallback to local seed template
    }
  }
];

// Test variables
const mockVariables = {
  RawMessage: "Mera payment cut gaya, par order confirm nahi hua.",
  Translation: "My payment was deducted, but the order was not confirmed.",
  Language: "Hinglish",
  SimilarTickets: "1. [Ticket ID: email-101] - Refund failed transaction"
};

function runPromptTemplateTests() {
  console.log("Starting unit tests for resolveAndInterpolate...");

  // Scenario 1: Topic found in Airtable and Active = true
  const resAirtableActive = resolveAndInterpolate("Billing & Payment", mockAirtableTemplates, mockVariables);
  
  console.assert(
    resAirtableActive.systemInstructions === "Airtable Billing System: Help customer with money.",
    `Expected Airtable billing system instructions, got "${resAirtableActive.systemInstructions}"`
  );
  console.assert(
    resAirtableActive.userPrompt.includes("Msg is Mera payment cut gaya, par order confirm nahi hua."),
    "User prompt variable interpolation for RawMessage failed."
  );
  console.assert(
    resAirtableActive.userPrompt.includes("Lang is Hinglish"),
    "User prompt variable interpolation for Language failed."
  );
  console.assert(
    resAirtableActive.userPrompt.includes("Similar:\n1. [Ticket ID: email-101] - Refund failed transaction"),
    "User prompt variable interpolation for SimilarTickets failed."
  );

  // Scenario 2: Topic in Airtable is Inactive -> Should fall back to local seed template (default-templates.json)
  const resFallbackToLocal = resolveAndInterpolate("Product Issue", mockAirtableTemplates, mockVariables);
  
  // The local fallback systemInstructions contains: "You are an expert product support assistant."
  console.assert(
    resFallbackToLocal.systemInstructions.includes("You are an expert product support assistant."),
    `Expected local fallback instructions for Product Issue, got "${resFallbackToLocal.systemInstructions}"`
  );
  console.assert(
    resFallbackToLocal.userPrompt.includes("English Translation (if applicable): My payment was deducted, but the order was not confirmed."),
    "Fallback user prompt variable interpolation failed."
  );

  // Scenario 3: Topic not in Airtable and not in local templates -> Should fall back to "Other"
  const resFallbackToOther = resolveAndInterpolate("Unrecognized Category", mockAirtableTemplates, mockVariables);
  
  console.assert(
    resFallbackToOther.systemInstructions.includes("You are a general customer support assistant."),
    `Expected fallback to "Other" system instructions, got "${resFallbackToOther.systemInstructions}"`
  );
  console.assert(
    resFallbackToOther.userPrompt.includes("Customer Preferred Language: Hinglish"),
    "Other fallback variable interpolation failed."
  );

  // Scenario 4: Missing variable values should load defaults safely
  const resEmptyVars = resolveAndInterpolate("Billing & Payment", mockAirtableTemplates, {});
  console.assert(
    resEmptyVars.userPrompt.includes("Msg is , Lang is English, Similar:\n*No similar historical tickets found.*"),
    `Expected fallbacks for empty variables, got "${resEmptyVars.userPrompt}"`
  );

  console.log("All prompt template selector and interpolation tests passed successfully!");
}

try {
  runPromptTemplateTests();
} catch (error) {
  console.error("Test suite failed:", error);
  process.exit(1);
}
