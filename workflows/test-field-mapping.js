/**
 * Comprehensive Field Mapping & Fallback Test Suite for Airtable Ingestion
 * Validates payload extraction for Email, WhatsApp, and malformed inputs.
 */

function extractPayload(inputBody) {
	const body = inputBody.body || inputBody;

	// Safe extractor for email addresses and phone numbers
	let contact = 'customer@example.com';
	if (typeof body.from === 'object' && body.from?.value?.[0]?.address) {
		contact = body.from.value[0].address;
	} else if (typeof body.from === 'string' && body.from.trim() !== '') {
		contact = body.from;
	} else if (body.email) {
		contact = body.email;
	} else if (body.phone || body.From) {
		contact = body.phone || body.From;
	}

	// Safe extractor for customer name
	let name = 'Anonymous Customer';
	if (typeof body.from === 'object' && body.from?.value?.[0]?.name) {
		name = body.from.value[0].name;
	} else if (body.name) {
		name = body.name;
	} else if (body.ProfileName) {
		name = body.ProfileName;
	}

	// Determine channel
	const channel = body.channel || ((body.From || body.phone) ? 'WhatsApp' : 'Email');

	// Safe content extractor
	const rawContent = (body.text || body.message || body.content || body.Body || '').trim() || 'No content provided';

	// Safe subject extractor
	const subject = (body.subject || (channel === 'WhatsApp' ? 'WhatsApp Inquiry' : 'Support Ticket')).trim();

	return {
		customerContact: contact,
		customerName: name,
		channel,
		rawContent,
		subject,
		timestamp: body.timestamp || new Date().toISOString()
	};
}

function mapToAirtableFields(extractedPayload, classification = {}) {
	return {
		"Sender": extractedPayload.customerContact || 'customer@example.com',
		"Customer Name": extractedPayload.customerName || 'Anonymous Customer',
		"Channel": extractedPayload.channel || 'Email',
		"Content": extractedPayload.rawContent || 'No content provided',
		"Subject": extractedPayload.subject || 'Support Request',
		"Category": classification.category || 'General',
		"Urgency": classification.urgency || 'Medium',
		"Location": classification.location || 'Unknown',
		"Original Language": classification.originalLanguage || 'en',
		"Matched Rule": classification.matchedRuleId || 'RULE-DEFAULT',
		"Created At": extractedPayload.timestamp
	};
}

const testInputs = [
	{
		name: "Standard Email Payload",
		input: {
			from: { value: [{ address: "rahul.sharma@example.com", name: "Rahul Sharma" }] },
			subject: "Damaged footwear delivered in Jaipur",
			text: "Mera joota toota hua nikla, kripya badal do."
		},
		expectedChannel: "Email",
		expectedSender: "rahul.sharma@example.com",
		expectedName: "Rahul Sharma"
	},
	{
		name: "Standard WhatsApp Payload (Twilio / Meta Webhook)",
		input: {
			From: "whatsapp:+919876543210",
			ProfileName: "Priya Patel",
			Body: "Order refund update kab aayega?",
		},
		expectedChannel: "WhatsApp",
		expectedSender: "whatsapp:+919876543210",
		expectedName: "Priya Patel"
	},
	{
		name: "Malformed / Empty Payload (Fallback Execution)",
		input: {},
		expectedChannel: "Email",
		expectedSender: "customer@example.com",
		expectedName: "Anonymous Customer"
	}
];

function runFieldMappingTests() {
	console.log("==========================================================");
	console.log("Running Ticket Field Mapping & Fallback Test Suite...");
	console.log("==========================================================\n");

	let passedCount = 0;

	testInputs.forEach((t, i) => {
		console.log(`[Test #${i + 1}] ${t.name}`);
		const extracted = extractPayload(t.input);
		const airtableFields = mapToAirtableFields(extracted);

		console.log("Extracted Payload  :", JSON.stringify(extracted));
		console.log("Airtable Field Map :", JSON.stringify(airtableFields));

		const channelMatch = extracted.channel === t.expectedChannel;
		const senderMatch = extracted.customerContact === t.expectedSender;
		const nameMatch = extracted.customerName === t.expectedName;

		if (channelMatch && senderMatch && nameMatch) {
			console.log(`✅ PASS: Correctly extracted and mapped all required fields!\n`);
			passedCount++;
		} else {
			console.log(`❌ FAIL: Expected channel ${t.expectedChannel}, sender ${t.expectedSender}\n`);
		}
	});

	console.log(`Summary: ${passedCount}/${testInputs.length} tests passed.`);
}

runFieldMappingTests();
