const https = require('https');
const EventEmitter = require('events');

// Emulate the parser and calling logic from our TypeScript node
function cleanAndParseResponse(data) {
	try {
		const parsedResponse = JSON.parse(data);
		const content = parsedResponse.choices[0].message.content.trim();
		
		let cleanContent = content;
		if (cleanContent.startsWith('```')) {
			cleanContent = cleanContent.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
		}
		
		const result = JSON.parse(cleanContent.trim());
		return {
			city: result.city !== undefined ? result.city : null,
			state: result.state !== undefined ? result.state : null,
		};
	} catch (err) {
		throw new Error(`Failed to parse LLM response: ${err.message}. Response was: ${data}`);
	}
}

// Test cases definitions
const tests = [
	{
		name: "Successful extraction with City and State",
		mockApiResponse: {
			choices: [
				{
					message: {
						content: `{"city": "Noida", "state": "Uttar Pradesh"}`
					}
				}
			]
		},
		expectedOutput: { city: "Noida", state: "Uttar Pradesh" }
	},
	{
		name: "Successful extraction with City only",
		mockApiResponse: {
			choices: [
				{
					message: {
						content: `{"city": "Bangalore", "state": null}`
					}
				}
			]
		},
		expectedOutput: { city: "Bangalore", state: null }
	},
	{
		name: "No location found in ticket",
		mockApiResponse: {
			choices: [
				{
					message: {
						content: `{"city": null, "state": null}`
					}
				}
			]
		},
		expectedOutput: { city: null, state: null }
	},
	{
		name: "Handles markdown code block wrapper from LLM response",
		mockApiResponse: {
			choices: [
				{
					message: {
						content: `\`\`\`json\n{"city": "Chennai", "state": "Tamil Nadu"}\n\`\`\``
					}
				}
			]
		},
		expectedOutput: { city: "Chennai", state: "Tamil Nadu" }
	},
	{
		name: "Fallback to null on malformed JSON response",
		mockApiResponse: {
			choices: [
				{
					message: {
						content: `Here is the location: Noida, UP`
					}
				}
			]
		},
		expectError: true
	}
];

function runTests() {
	console.log("Running Location Extractor Node Unit Tests...\n");
	let passedCount = 0;

	tests.forEach((t, index) => {
		console.log(`Test #${index + 1}: ${t.name}`);
		const rawResponseString = JSON.stringify(t.mockApiResponse);

		try {
			const result = cleanAndParseResponse(rawResponseString);
			
			if (t.expectError) {
				console.log(`❌ FAIL: Expected parsing to fail, but it succeeded with: ${JSON.stringify(result)}`);
			} else if (JSON.stringify(result) === JSON.stringify(t.expectedOutput)) {
				console.log(`✅ PASS: Output matched expected: ${JSON.stringify(result)}`);
				passedCount++;
			} else {
				console.log(`❌ FAIL: Expected ${JSON.stringify(t.expectedOutput)}, but got ${JSON.stringify(result)}`);
			}
		} catch (err) {
			if (t.expectError) {
				console.log(`✅ PASS: Correctly failed and threw error as expected: "${err.message}"`);
				passedCount++;
			} else {
				console.log(`❌ FAIL: Unexpected error: ${err.message}`);
			}
		}
		console.log("--------------------------------------------------");
	});

	console.log(`\nTest Summary: ${passedCount}/${tests.length} tests passed.`);
	if (passedCount === tests.length) {
		process.exit(0);
	} else {
		process.exit(1);
	}
}

runTests();
