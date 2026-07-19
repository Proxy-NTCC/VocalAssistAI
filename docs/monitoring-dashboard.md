# Workflow Status Monitoring Dashboard Setup

To monitor the health, performance, and exceptions of **VocalAssistAI**, administrators can configure distinct dashboard views directly inside their Airtable workspace and connect custom error capture branches inside n8n.

---

## 1. Airtable Dashboard Views

By leveraging the `Status`, `Error Log`, and `Created Time` fields in the `Tickets` table, admins can create three high-visibility views to monitor workflow progress:

### A. View 1: 📋 All Run Logs (Audit Log)
* **Goal**: Track all tickets processed by the system.
* **Airtable Configuration**:
  - **View Type**: Grid View
  - **Name**: `System Audit Logs`
  - **Sort**: `Created Time` (9 → 1, newest first)
  - **Columns Visible**: `Record ID`, `Ticket ID`, `Source`, `Customer Identifier`, `Topic`, `Urgency`, `Status`, `Created Time`.

### B. View 2: 🚨 Error & Failed Ingestions
* **Goal**: Isolate and highlight failing executions.
* **Airtable Configuration**:
  - **View Type**: Grid View
  - **Name**: `Failed Executions`
  - **Filter**: `Where {Status} = 'Failed'`
  - **Columns Visible**: `Ticket ID`, `Source`, `Subject`, `Error Log`, `Resync` (Checkbox), `Created Time`.
  - **Note**: Support engineers can inspect the `Error Log` column, resolve the underlying API/network issue, check the `Resync` checkbox, and click Save. This immediately clears the error status and invokes the reprocess workflow.

### C. View 3: ✍️ Agent Draft Review Queue
* **Goal**: The workspace where customer service agents view successfully processed tickets.
* **Airtable Configuration**:
  - **View Type**: Grid View
  - **Name**: `Pending Draft Review`
  - **Filter**: `Where {Status} = 'Draft Ready'`
  - **Columns Visible**: `Customer Identifier`, `Subject`, `Raw Message`, `English Translation`, `Detected Language`, `Topic`, `Urgency`, `Draft Reply`, `Similar Tickets`.

---

## 2. n8n Error Ingestion Node Design

When building the main ticket orchestrator, you should wrap critical steps inside an error boundary:

1. **Option A (Centralized Error Trigger)**:
   - Create a separate workflow triggered by the n8n **Error Trigger** node.
   - When any workflow execution fails, n8n invokes this handler, passing the execution ID and error details.
   
2. **Option B (Inline Catch Branches - Recommended)**:
   - Set the `continueOnFail` setting on critical HTTP/LLM nodes.
   - Route the failure output port of those nodes to a **Sanitize Error** Javascript Code node.
   - Feed the scrubbed error message to the **Update status to Failed** Airtable node.

### Inline Code Node Mapping (n8n JS Syntax)
```javascript
const rawError = $json.error || 'Unknown workflow step execution failed.';
const sanitizedMsg = require('./utils/sanitizeError').sanitizeError(rawError);

return {
  json: {
    status: "Failed",
    errorLog: sanitizedMsg
  }
};
```
