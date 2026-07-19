const fs = require('fs');

const workflowPath = './PRJ-6111-0023-retry-with-logging.json';
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

let currentNodeName = 'Initialize Attempt Count';
let item = { json: {} };

const getNode = (name) => workflow.nodes.find(n => n.name === name);
const getNextNodes = (nodeName, outputIndex = 0) => {
    const connections = workflow.connections[nodeName];
    if (!connections || !connections.main || !connections.main[outputIndex]) return [];
    return connections.main[outputIndex].map(c => c.node);
};

let iteration = 0;
const MAX_ITERATIONS = 50;

console.log("Starting simulation...");

while (currentNodeName && iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\nExecuting Node: ${currentNodeName}`);
    const node = getNode(currentNodeName);
    if (!node) {
        console.error(`Node not found: ${currentNodeName}`);
        break;
    }

    let nextOutputIndex = 0;

    // Simulate node execution
    if (node.type === 'n8n-nodes-base.set') {
        const assignments = node.parameters?.assignments?.assignments || [];
        assignments.forEach(a => {
            console.log(`  Set: ${a.name} = ${a.value}`);
            item.json[a.name] = a.value;
        });
    } else if (node.type === 'n8n-nodes-base.httpRequest') {
        // Simulate failure
        console.log(`  HTTPRequest to ${node.parameters.url} -> Simulating Failure 500`);
        item.json.error = { message: "Internal Server Error" };
        nextOutputIndex = 1; // n8n error branch
    } else if (node.type === 'n8n-nodes-base.if') {
        // Check for Error or Check Retry Limit
        if (node.name === 'Check for Error') {
            const hasError = !!item.json.error;
            console.log(`  Condition check: error exists? ${hasError}`);
            nextOutputIndex = hasError ? 0 : 1;
        } else if (node.name === 'Check Retry Limit') {
            const lte3 = item.json.attemptCount <= 3;
            console.log(`  Condition check: attemptCount (${item.json.attemptCount}) <= 3 ? ${lte3}`);
            nextOutputIndex = lte3 ? 0 : 1;
        }
    } else if (node.type === 'n8n-nodes-base.code') {
        item.json.attemptCount = (item.json.attemptCount || 0) + 1;
        console.log(`  Code executed. attemptCount is now: ${item.json.attemptCount}`);
    } else if (node.type === 'n8n-nodes-base.airtable') {
        const columns = node.parameters.columns.value;
        console.log(`  Airtable appended record:`);
        console.log(`    Status: ${columns.Status}`);
        console.log(`    Attempt Number: ${item.json.attemptCount}`);
        console.log(`    Error Message: ${item.json.error?.message}`);
        if (columns.error_message) {
            console.log(`    error_message: ${item.json.error?.message}`);
            console.log(`    error_timestamp: (timestamp string)`);
        }
    } else if (node.type === 'n8n-nodes-base.wait') {
        console.log(`  Waiting...`);
    }

    const nextNodes = getNextNodes(currentNodeName, nextOutputIndex);
    if (nextNodes.length > 0) {
        currentNodeName = nextNodes[0];
    } else {
        currentNodeName = null;
    }
}

console.log("\nSimulation Complete. Final Item State:", JSON.stringify(item, null, 2));
