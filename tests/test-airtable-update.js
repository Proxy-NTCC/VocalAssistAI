const { formatSimilarTickets } = require('../workflows/utils/formatSimilarTickets');

// Mock data: Retrieved matches from a vector search run
const mockVectorMatches = [
  {
    id: "email-401",
    score: 0.9254,
    metadata: {
      summary: "Refund status request for failed UPI transaction",
      date: "2026-07-18T14:22:10.000Z",
      status: "Closed",
      airtableRecordId: "recRefund998"
    }
  },
  {
    id: "email-402",
    score: 0.8512,
    metadata: {
      summary: "UPI payment deducted twice, order pending",
      date: "2026-07-19T08:12:00.000Z",
      status: "Investigating",
      airtableRecordId: "recUpiTwice"
    }
  }
];

function runAirtableUpdateTest() {
  console.log("Simulating Airtable update payload generation...");

  const baseId = "appVocalAssistCRM";
  const tableNameOrId = "Tickets";
  const targetRecordId = "recCurrentIngestedTicket";
  const currentTicketId = "email-current-incoming";

  // 1. Generate formatting
  const formattingResult = formatSimilarTickets(mockVectorMatches, {
    currentTicketId,
    baseId,
    tableNameOrId,
    similarityThreshold: 0.7
  });

  // 2. Build Airtable update payload format expected by n8n
  const simulatedAirtablePayload = {
    id: targetRecordId,
    fields: {
      "Similar Tickets": formattingResult.markdownText,
      "Status": "Draft Ready"
    }
  };

  // Assertions
  console.assert(simulatedAirtablePayload.id === "recCurrentIngestedTicket", "Airtable target record ID is incorrect.");
  console.assert(typeof simulatedAirtablePayload.fields === 'object', "Airtable payload fields should be an object.");
  console.assert(simulatedAirtablePayload.fields["Status"] === "Draft Ready", "Workflow status transition target should be 'Draft Ready'.");
  
  const markdownText = simulatedAirtablePayload.fields["Similar Tickets"];
  console.assert(markdownText.includes("### Similar Historical Tickets:"), "Markdown text header missing.");
  console.assert(markdownText.includes("https://airtable.com/appVocalAssistCRM/Tickets/recRefund998"), "Refund link structure incorrect.");
  console.assert(markdownText.includes("https://airtable.com/appVocalAssistCRM/Tickets/recUpiTwice"), "UPI twice link structure incorrect.");
  console.assert(markdownText.includes("Refund status request for failed UPI transaction"), "Summary extraction failed.");
  console.assert(markdownText.includes("**Status:** Closed"), "Status metadata mapping failed.");
  console.assert(markdownText.includes("**Status:** Investigating"), "Status metadata mapping failed.");

  console.log("Simulated Airtable Update Payload:");
  console.log(JSON.stringify(simulatedAirtablePayload, null, 2));
  console.log("Airtable update simulation tests passed successfully!");
}

try {
  runAirtableUpdateTest();
} catch (err) {
  console.error("Airtable update test failed:", err);
  process.exit(1);
}
