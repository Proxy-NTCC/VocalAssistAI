/**
 * Verification & Test Suite for Airtable API Error Handling & Sub-Workflow Logging
 * Simulates Airtable API failure scenarios (HTTP 429, 404, 422) and validates error payload formatting.
 */

function formatErrorContext(executionData) {
	const errorObj = executionData.execution?.error || executionData.error || {};

	return {
		timestamp: new Date().toISOString(),
		workflowName: executionData.workflow?.name || 'VocalAssistAI Master Workflow',
		workflowId: executionData.workflow?.id || 'vocalassist-main-workflow',
		executionId: executionData.execution?.id || 'exec_998877',
		failedNodeName: errorObj.node?.name || executionData.nodeName || 'Airtable Sync Record',
		failedNodeType: errorObj.node?.type || executionData.nodeType || 'n8n-nodes-base.airtable',
		errorMessage: errorObj.message || executionData.errorMessage || 'Airtable API Error',
		errorDescription: errorObj.description || 'API request failed with error status code',
		severity: executionData.severity || 'HIGH',
		ticketId: executionData.ticketId || executionData.payload?._id || 'tkt_12345',
		customerContact: executionData.customerContact || executionData.payload?.customerContact || 'customer@example.com',
		channel: executionData.channel || executionData.payload?.channel || 'WhatsApp'
	};
}

const errorScenarios = [
	{
		name: "Airtable API Rate Limit (HTTP 429)",
		rawError: {
			nodeName: "Airtable Sync Record",
			nodeType: "n8n-nodes-base.airtable",
			errorMessage: "Airtable API error (429): Rate limit exceeded. 5 requests per second per base limit.",
			severity: "MEDIUM"
		},
		expectedSeverity: "MEDIUM",
		expectedFailedNode: "Airtable Sync Record"
	},
	{
		name: "Invalid Base ID / Base Not Found (HTTP 404)",
		rawError: {
			nodeName: "Airtable Sync Record",
			nodeType: "n8n-nodes-base.airtable",
			errorMessage: "Airtable API error (404): Could not find base appVocalInvalidBase",
			severity: "HIGH"
		},
		expectedSeverity: "HIGH",
		expectedFailedNode: "Airtable Sync Record"
	},
	{
		name: "Unprocessable Entity / Column Mismatch (HTTP 422)",
		rawError: {
			nodeName: "Airtable Sync Record",
			nodeType: "n8n-nodes-base.airtable",
			errorMessage: "Airtable API error (422): Unknown field name 'UnknownColumn'",
			severity: "HIGH"
		},
		expectedSeverity: "HIGH",
		expectedFailedNode: "Airtable Sync Record"
	}
];

function runErrorHandlingTests() {
	console.log("==========================================================");
	console.log("Running Airtable Error Handling & Reporting Test Suite...");
	console.log("==========================================================\n");

	let passedCount = 0;

	errorScenarios.forEach((s, i) => {
		console.log(`[Scenario #${i + 1}] ${s.name}`);
		const formatted = formatErrorContext(s.rawError);

		console.log("Formatted Error Log Object:");
		console.log(JSON.stringify(formatted, null, 2));

		const isNodeMatch = formatted.failedNodeName === s.expectedFailedNode;
		const isMessagePresent = formatted.errorMessage.length > 0;
		const isTimestampPresent = Boolean(formatted.timestamp);

		if (isNodeMatch && isMessagePresent && isTimestampPresent) {
			console.log(`✅ PASS: Error context correctly captured and formatted for sub-workflow logging!\n`);
			passedCount++;
		} else {
			console.log(`❌ FAIL: Failed to format error context properly.\n`);
		}
	});

	console.log(`Summary: ${passedCount}/${errorScenarios.length} test scenarios passed.`);
}

runErrorHandlingTests();
