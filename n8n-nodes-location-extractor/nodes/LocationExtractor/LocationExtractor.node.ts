import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import * as https from 'https';
import * as http from 'http';

export class LocationExtractor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Location Extractor',
		name: 'locationExtractor',
		icon: 'fa:map-marker-alt',
		group: ['transform'],
		version: 1,
		description: 'Extracts city and state from support ticket text using OpenAI GPT models.',
		defaults: {
			name: 'Location Extractor',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'OpenAI API Key',
				name: 'apiKey',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '={{ $env.OPENAI_API_KEY }}',
				required: false,
				description: 'Your OpenAI API key. Can be left blank if the OPENAI_API_KEY environment variable is set.',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'GPT-4o Mini (Recommended)',
						value: 'gpt-4o-mini',
					},
					{
						name: 'GPT-4o',
						value: 'gpt-4o',
					},
					{
						name: 'GPT-3.5 Turbo',
						value: 'gpt-3.5-turbo',
					},
				],
				default: 'gpt-4o-mini',
				description: 'The OpenAI model to use for extraction.',
			},
			{
				displayName: 'Ticket Text',
				name: 'ticketText',
				type: 'string',
				default: '',
				required: true,
				description: 'The text of the support ticket to extract location from.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			let ticketText = '';
			let ticketId = 'unknown';
			try {
				const inputJson = items[i].json;
				if (inputJson) {
					ticketId = inputJson.id || inputJson._id || inputJson.ticketId || inputJson.originalId || 'unknown';
				}

				let apiKey = this.getNodeParameter('apiKey', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				ticketText = this.getNodeParameter('ticketText', i) as string;

				if (!apiKey || apiKey.startsWith('={{') || apiKey.trim() === '') {
					apiKey = process.env.OPENAI_API_KEY || '';
				}

				if (!apiKey) {
					throw new NodeOperationError(this.getNode(), 'OpenAI API Key is required (via node parameter or OPENAI_API_KEY environment variable).');
				}

				if (!ticketText || ticketText.trim() === '') {
					returnData.push({
						json: {
							city: null,
							state: null,
							error: 'Empty ticket text provided',
						},
					});
					continue;
				}

				const result = await this.callOpenAI(apiKey, model, ticketText);
				returnData.push({ json: result });
			} catch (error: any) {
				console.error(`[LocationExtractor Error] Failed during execution step. Step: Location Extraction. Ticket ID: "${ticketId}". Ticket text: "${ticketText ? ticketText.substring(0, 100) : 'unknown'}...". Error: ${error.message || error}`);
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							city: null,
							state: null,
							error: error.message || error,
						},
					});
				} else {
					throw new NodeOperationError(this.getNode(), error);
				}
			}
		}

		return [returnData];
	}

	private async callOpenAI(apiKey: string, model: string, ticketText: string): Promise<{ city: string | null; state: string | null }> {
		const systemPrompt = `You are a precise location extraction assistant for customer support tickets in India.
Your task is to analyze the input ticket text and extract the city and state mentioned by the customer.

Strict Constraints:
1. Identify the city and state.
2. The city and state must refer to the customer's location, the location relevant to their order, or the location of their support issue.
3. If a city or state is not mentioned or cannot be determined, return null for that field. Do not guess or hallucinate.
4. Output must be a valid JSON object with exactly two keys: "city" and "state".
5. Do not include any explanations, introductory text, conversational text, or markdown code blocks (such as \`\`\`json). Return ONLY the raw JSON string.

Examples:
- Input: "Sir mera parcel abhi tak Noida nahi pahuncha hai. Order ID 123."
  Output: {"city": "Noida", "state": "Uttar Pradesh"}

- Input: "I bought a shirt from the Bangalore store but it is torn."
  Output: {"city": "Bangalore", "state": "Karnataka"}

- Input: "Help, my app is not working. I cannot log in."
  Output: {"city": null, "state": null}

- Input: "Mera delivery address badal ke Patna, Bihar kar do."
  Output: {"city": "Patna", "state": "Bihar"}

- Input: "I live in Maharashtra but order was sent to Chennai."
  Output: {"city": "Chennai", "state": "Tamil Nadu"}`;

		const postData = JSON.stringify({
			model: model,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: `Input Ticket Text:\n"${ticketText}"\n\nReturn the JSON:` },
			],
			temperature: 0,
		});

		const protocol = process.env.OPENAI_API_PROTOCOL || 'https';
		const hostname = process.env.OPENAI_API_HOST || 'api.openai.com';
		const port = process.env.OPENAI_API_PORT ? parseInt(process.env.OPENAI_API_PORT, 10) : (protocol === 'http' ? 80 : 443);
		const path = process.env.OPENAI_API_PATH || '/v1/chat/completions';

		const options = {
			hostname: hostname,
			port: port,
			path: path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
				'Content-Length': Buffer.byteLength(postData),
			},
		};

		const requester = protocol === 'http' ? http : https;

		return new Promise((resolve, reject) => {
			const req = requester.request(options, (res) => {
				let data = '';

				res.on('data', (chunk) => {
					data += chunk;
				});

				res.on('end', () => {
					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
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
							
							// Strip out any potential markdown code blocks if the model failed to follow constraint 5
							let cleanContent = content;
							if (cleanContent.startsWith('```')) {
								cleanContent = cleanContent.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
							}
							
							const result = JSON.parse(cleanContent.trim());
							resolve({
								city: result.city !== undefined ? result.city : null,
								state: result.state !== undefined ? result.state : null,
							});
						} catch (err) {
							reject(new Error(`Failed to parse LLM response: ${err.message}. Response was: ${data}`));
						}
					} else {
						reject(new Error(`OpenAI API error (${res.statusCode}): ${data}`));
					}
				});
			});

			req.on('error', (e) => {
				reject(new Error(`Network error calling OpenAI: ${e.message}`));
			});

			req.write(postData);
			req.end();
		});
	}
}
