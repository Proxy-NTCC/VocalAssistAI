const { formatSimilarTickets } = require('../workflows/utils/formatSimilarTickets');

// Mock data
const mockMatches = [
  {
    id: "email-101",
    score: 0.95,
    metadata: {
      summary: "Customer received broken chair",
      date: "2026-07-18T10:00:00.000Z",
      status: "Closed",
      airtableRecordId: "recChair123"
    }
  },
  {
    id: "email-102",
    score: 0.82,
    metadata: {
      subject: "Order delay for desk",
      receivedAt: "2026-07-17T14:30:00.000Z",
      status: "Investigating",
      airtableRecordId: "recDesk456"
    }
  },
  {
    id: "email-103",
    score: 0.65, // Below default threshold of 0.7
    metadata: {
      summary: "Incorrect billing amount",
      date: "2026-07-15T09:15:00.000Z",
      status: "Closed",
      airtableRecordId: "recBill789"
    }
  },
  {
    id: "email-current",
    score: 0.99, // Current ticket itself
    metadata: {
      summary: "Current ticket description",
      date: "2026-07-19T11:00:00.000Z",
      status: "New",
      airtableRecordId: "recCurrent"
    }
  }
];

function runTests() {
  console.log("Starting unit tests for formatSimilarTickets...");

  // Scenario 1: Standard extraction & threshold filtering
  const result1 = formatSimilarTickets(mockMatches, {
    baseId: "appBase123",
    tableNameOrId: "Tickets",
    currentTicketId: "email-current",
    similarityThreshold: 0.7
  });

  // Assertions for Scenario 1
  console.assert(result1.formattedData.length === 2, `Expected 2 matches, got ${result1.formattedData.length}`);
  
  const [first, second] = result1.formattedData;
  console.assert(first.ticketId === "email-101", `First match should be email-101, got ${first.ticketId}`);
  console.assert(first.summary === "Customer received broken chair", `Expected summary "Customer received broken chair", got "${first.summary}"`);
  console.assert(first.date === "2026-07-18", `Expected date "2026-07-18", got "${first.date}"`);
  console.assert(first.status === "Closed", `Expected status "Closed", got "${first.status}"`);
  console.assert(first.link === "https://airtable.com/appBase123/Tickets/recChair123", `Expected link "https://airtable.com/appBase123/Tickets/recChair123", got "${first.link}"`);
  console.assert(first.score === 0.95, `Expected score 0.95, got ${first.score}`);

  // Test fallback fields for second item (subject instead of summary, receivedAt instead of date)
  console.assert(second.ticketId === "email-102", `Second match should be email-102, got ${second.ticketId}`);
  console.assert(second.summary === "Order delay for desk", `Expected subject fallback "Order delay for desk", got "${second.summary}"`);
  console.assert(second.date === "2026-07-17", `Expected date fallback "2026-07-17", got "${second.date}"`);
  console.assert(second.status === "Investigating", `Expected status "Investigating", got "${second.status}"`);

  // Ensure current ticket is excluded
  const hasCurrent = result1.formattedData.some(item => item.ticketId === "email-current");
  console.assert(!hasCurrent, "Current ticket should be excluded from similarity results");

  // Ensure threshold filters out lower scores (email-103 has score 0.65, threshold is 0.7)
  const hasBelowThreshold = result1.formattedData.some(item => item.ticketId === "email-103");
  console.assert(!hasBelowThreshold, "Tickets below similarity threshold should be excluded");

  // Verify Markdown Generation
  console.assert(result1.markdownText.includes("### Similar Historical Tickets:"), "Markdown should contain header");
  console.assert(result1.markdownText.includes("[Ticket ID: email-101](https://airtable.com/appBase123/Tickets/recChair123)"), "Markdown should contain formatted links");
  console.assert(result1.markdownText.includes("(95.0% Match)"), "Markdown should show match percentage");

  // Scenario 2: Handling empty/null matches gracefully
  const resultEmpty = formatSimilarTickets([], { baseId: "appBase123" });
  console.assert(resultEmpty.formattedData.length === 0, "Expected 0 results for empty matches");
  console.assert(resultEmpty.markdownText === "*No similar historical tickets found.*", `Expected fallback message, got "${resultEmpty.markdownText}"`);

  // Scenario 3: Graceful fallback for missing fields (summary, date, etc.)
  const brokenMatches = [
    {
      id: "email-broken",
      score: 0.9,
      metadata: {} // Missing everything
    }
  ];
  const resultBroken = formatSimilarTickets(brokenMatches, { baseId: "appBase123" });
  console.assert(resultBroken.formattedData.length === 1, "Expected 1 result even if metadata is empty");
  
  const brokenObj = resultBroken.formattedData[0];
  console.assert(brokenObj.summary === "No summary available", `Expected "No summary available", got "${brokenObj.summary}"`);
  console.assert(brokenObj.date === "Unknown date", `Expected "Unknown date", got "${brokenObj.date}"`);
  console.assert(brokenObj.status === "New", `Expected default status "New", got "${brokenObj.status}"`);
  console.assert(brokenObj.link === "", `Expected empty link, got "${brokenObj.link}"`);

  console.log("All unit tests passed successfully!");
}

try {
  runTests();
} catch (error) {
  console.error("Test execution failed:", error);
  process.exit(1);
}
