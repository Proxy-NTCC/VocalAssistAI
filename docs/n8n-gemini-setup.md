# n8n and Gemini setup

1. In this repository, copy `.env.example` to `.env`.
2. Open `.env` and replace `GEMINI_API_KEY` with the Gemini API key from Google AI Studio.
3. Replace `N8N_ENCRYPTION_KEY` with a long random private value.
4. Run `docker compose up -d` from the repository folder.
5. Open `http://localhost:5679` and create the local n8n owner account.

Do not upload `.env` or paste either key into chat, screenshots, or GitHub.

## Workflow implementation plan

Create an n8n workflow with these nodes:

1. Manual Trigger (or Webhook)
2. Edit Fields: set `ticketText`
3. HTTP Request: call the Gemini API using `GEMINI_API_KEY`
4. Code: parse the model JSON and output `topic`, `confidence`, and `reason`

Use the categories and prompt in `docs/ticket-topic-classification.md`.

## Import the prepared workflow

1. In n8n, open **Workflows** and choose **Import from File**.
2. Select `workflows/ticket-topic-classification.json` from this repository.
3. Open **Set Ticket Text** and replace the sample ticket with any ticket from `tests/topic-classification-samples.json`.
4. Click **Execute Workflow**.

The final **Parse Topic Output** node returns `ticketText`, `topic`, `confidence`, and `reason`.
