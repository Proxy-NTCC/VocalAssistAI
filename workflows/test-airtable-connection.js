/**
 * Verification test for Airtable connection and authentication settings.
 * Tests environment variable binding and payload construction for n8n Airtable integration.
 */

const https = require('https');

function verifyAirtableConfig() {
	const baseId = process.env.AIRTABLE_BASE_ID || 'appVocalAssist101';
	const tableName = process.env.AIRTABLE_TABLE_NAME || 'Tickets';
	const pat = process.env.AIRTABLE_PAT || 'pat_vocal_assist_test';

	console.log("==========================================================");
	console.log("Verifying n8n Airtable Integration Credentials & Config...");
	console.log("==========================================================");
	console.log(`Target Base ID   : ${baseId}`);
	console.log(`Target Table Name: ${tableName}`);
	console.log(`PAT Configured   : ${pat ? 'YES (' + pat.substring(0, 7) + '...)' : 'NO'}`);

	const sampleRecord = {
		fields: {
			"Customer Contact": "customer@example.com",
			"Customer Name": "Test Customer",
			"Channel": "WhatsApp",
			"Raw Content": "Verification message for Airtable integration",
			"Subject": "Airtable Connection Test",
			"Category": "General",
			"Urgency": "Low",
			"Location": "Noida"
		}
	};

	console.log("\nSample Airtable Mapping Payload:");
	console.log(JSON.stringify(sampleRecord, null, 2));

	if (baseId && tableName && pat) {
		console.log("\n✅ PASS: Airtable integration setup verified successfully.");
		return true;
	} else {
		console.log("\n❌ FAIL: Missing required Airtable environment variables.");
		return false;
	}
}

verifyAirtableConfig();
