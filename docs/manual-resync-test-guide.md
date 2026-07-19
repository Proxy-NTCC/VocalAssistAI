# Manual Ticket Resync - Testing Guide

This guide details how to verify and test the **Manual Ticket Resync Trigger** workflow (`workflows/manual-resync.json`) using mock payloads, without requiring a live connection to Airtable.

---

## 1. Local Testing Setup (Offline Sandbox)

To test the logic flow of the manual resync trigger in n8n without live Airtable credentials, you can use n8n's **Pin Data** feature.

### Step 1: Import Workflow
1. Open n8n UI (`http://localhost:5679`).
2. Select **Workflows** -> **Import from File**.
3. Choose `workflows/manual-resync.json`.

### Step 2: Pin Mock Trigger Data
1. Open the first node: **Airtable Trigger Resync**.
2. On the input pane, click on the **Settings** or **Pin Data** tab.
3. Paste the contents of `tests/mock-airtable-trigger.json` (specifically the payload object from the "Successful Resync Trigger" scenario).
4. Click **Pin Data**. This tells n8n to treat this mock JSON object as the output of this trigger node for all execution runs, skipping the real API query.

### Step 3: Configure Database Nodes to Sandbox Mode (No Credentials)
Because you might not have live Airtable credentials connected yet, you should tell n8n to bypass the write nodes during the dry run:
1. Open the **Lock & Mark Processing** node -> click the gear icon (settings) -> check **Disable Node** (or check **Always Output Data**).
2. Repeat for **Update Status Success** and **Update Status Failure** nodes.
*Alternatively, you can create a test Airtable base and input real API credentials to run a live integration test.*

---

## 2. Test Scenarios

### Scenario A: Successful Resync Processing
1. Pin the mock payload where `"Resync": true`.
2. Click **Execute Workflow**.
3. **Verify the Path:**
   - **Filter Resync True:** Checks the value of `Resync`. Since it is `true`, execution should proceed to the "True" output branch.
   - **Lock & Mark Processing:** Fires (updates Status to `Processing` and unchecks `Resync`).
   - **Execute Reprocess Workflow:** Executes the sub-workflow (e.g. classification).
   - **Check Execution Success:** Checks if the sub-workflow executed without errors. Since this mock run completes successfully, it should route to the **True** branch.
   - **Update Status Success:** Updates Airtable record status to `Draft Ready`.

### Scenario B: Filter Out Non-Resync Updates
Airtable triggers updates on *any* field change. We must confirm the workflow ignores updates where the `Resync` checkbox is unchecked.
1. Pin the mock payload from the "Ignored Trigger (Resync Checkbox False)" scenario (`"Resync": false`).
2. Click **Execute Workflow**.
3. **Verify the Path:**
   - **Filter Resync True:** Should evaluate `fields.Resync = false`.
   - **Result:** The execution must stop here. No branches should fire, and the update/reprocessing nodes must not run. This validates that the trigger loop is successfully broken.

---

## 3. Production Readiness Checklist

Before moving to production:
- Ensure the `Execute Reprocess Workflow` node is linked to the primary processing sub-workflow ID instead of the sandbox classification template.
- Verify the credentials for the Airtable nodes are set to your live Airtable Personal Access Token.
- Confirm the table name in `.env` matches the actual name of your table in Airtable.
