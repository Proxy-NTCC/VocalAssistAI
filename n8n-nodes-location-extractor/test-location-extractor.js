const https = require('https');
const EventEmitter = require('events');

// Emulate the parser and calling logic from our TypeScript node
function cleanAndParseResponse(data) {
	try {
		const parsedResponse = JSON.parse(data);
		if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
			throw new Error('No choices returned in OpenAI response');
		}
		const firstChoice = parsedResponse.choices[0];
		if (!firstChoice.message || firstChoice.message.content === undefined) {
			throw new Error('No message or content returned in OpenAI choice');
		}
		const content = firstChoice.message.content.trim();
		
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

// Emulate node execution error handling & continueOnFail fallback logic
function executeNodeItem(itemJson, ticketText, mockApiCall, continueOnFail = true) {
	const ticketId = itemJson ? (itemJson.id || itemJson._id || itemJson.ticketId || itemJson.originalId || 'unknown') : 'unknown';
	
	if (!ticketText || ticketText.trim() === '') {
		return {
			city: null,
			state: null,
			error: 'Empty ticket text provided'
		};
	}

	try {
		const result = mockApiCall();
		return result;
	} catch (error) {
		console.error(`[LocationExtractor Error Log] Step: Location Extraction | Ticket ID: "${ticketId}" | Input: "${ticketText.substring(0, 50)}..." | Error: ${error.message || error}`);
		if (continueOnFail) {
			return {
				city: null,
				state: null,
				error: error.message || String(error)
			};
		} else {
			throw error;
		}
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
		name: "Fallback to error object on malformed JSON response",
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
	},
	{
		name: "Empty choices returned in OpenAI response",
		mockApiResponse: {
			choices: []
		},
		expectError: true
	},
	{
		name: "No message or content returned in OpenAI choice",
		mockApiResponse: {
			choices: [
				{
					message: {}
				}
			]
		},
		expectError: true
	}
];

const apiFailureTests = [
	{
		name: "Simulated OpenAI API Rate Limit Error (HTTP 429)",
		statusCode: 429,
		responseData: "Rate limit exceeded",
		expectError: true
	},
	{
		name: "Simulated OpenAI Internal Server Error (HTTP 500)",
		statusCode: 500,
		responseData: "Internal Server Error",
		expectError: true
	},
	{
		name: "Simulated Network Timeout/DNS Error",
		networkErrorMsg: "getaddrinfo ENOTFOUND api.openai.com",
		expectError: true
	}
];

function simulateRequestBehavior(statusCode, responseData, networkErrorMsg) {
	return new Promise((resolve, reject) => {
		if (networkErrorMsg) {
			reject(new Error(`Network error calling OpenAI: ${networkErrorMsg}`));
			return;
		}

		if (statusCode && statusCode >= 200 && statusCode < 300) {
			try {
				const result = cleanAndParseResponse(responseData);
				resolve(result);
			} catch (err) {
				reject(err);
			}
		} else {
			reject(new Error(`OpenAI API error (${statusCode}): ${responseData}`));
		}
	});
}

async function runTests() {
	console.log("Running Location Extractor Node Unit Tests...\n");
	let passedCount = 0;
	let totalCount = tests.length + apiFailureTests.length + 2; // +2 for continueOnFail & empty input tests

	// 1. Run Response Parsing Tests
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

	// 2. Run API and Network Failure Simulation Tests
	console.log("\nRunning API Failure and Network Simulation Tests...\n");
	for (let i = 0; i < apiFailureTests.length; i++) {
		const t = apiFailureTests[i];
		console.log(`API Test #${i + 1}: ${t.name}`);

		try {
			const result = await simulateRequestBehavior(t.statusCode, t.responseData, t.networkErrorMsg);
			if (t.expectError) {
				console.log(`❌ FAIL: Expected operation to fail, but it succeeded with: ${JSON.stringify(result)}`);
			} else {
				console.log(`✅ PASS: Operation succeeded with: ${JSON.stringify(result)}`);
				passedCount++;
			}
		} catch (err) {
			if (t.expectError) {
				console.log(`✅ PASS: Correctly caught error: "${err.message}"`);
				passedCount++;
			} else {
				console.log(`❌ FAIL: Unexpected error: ${err.message}`);
			}
		}
		console.log("--------------------------------------------------");
	}

	// 3. Graceful Continuation on Fail Test
	console.log("\nRunning Graceful Continue On Fail Test...\n");
	const failRes = executeNodeItem({ id: 'ticket_999' }, 'Sample ticket text', () => {
		throw new Error('API Rate Limit Exceeded (HTTP 429)');
	}, true);

	if (failRes.city === null && failRes.state === null && failRes.error) {
		console.log(`✅ PASS: Gracefully returned default object on failure: ${JSON.stringify(failRes)}`);
		passedCount++;
	} else {
		console.log(`❌ FAIL: Did not return default object on failure: ${JSON.stringify(failRes)}`);
	}
	console.log("--------------------------------------------------");

	// 4. Empty Input Handling Test
	console.log("\nRunning Empty Input Handling Test...\n");
	const emptyRes = executeNodeItem({ id: 'ticket_1000' }, '   ', () => {}, true);
	if (emptyRes.city === null && emptyRes.state === null && emptyRes.error === 'Empty ticket text provided') {
		console.log(`✅ PASS: Handled empty ticket text gracefully: ${JSON.stringify(emptyRes)}`);
		passedCount++;
	} else {
		console.log(`❌ FAIL: Empty input test failed: ${JSON.stringify(emptyRes)}`);
	}
	console.log("--------------------------------------------------");

	console.log(`\nTest Summary: ${passedCount}/${totalCount} tests passed.`);
	if (passedCount === totalCount) {
		console.log("All error scenario test suites passed successfully!\n");
	} else {
		console.log("Some tests failed.\n");
	}
}

runTests();
