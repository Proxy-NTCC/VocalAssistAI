# Airtable Base Schema Guide

This document specifies the database structure for **VocalAssistAI** in Airtable. This schema maps incoming multilingual customer tickets, stores classification metadata, and tracks resolution status.

---

## 1. Tables Overview

The CRM base consists of a primary table named **`Tickets`** (configured via the `AIRTABLE_TABLE_NAME` environment variable).

---

## 2. Table: `Tickets`

This table records all incoming support tickets from email and WhatsApp, along with enrichment metadata (language, sentiment, topic) and AI-generated drafts.

### Fields Specification

| Field Name | Type | Description | Key Role / Constraints |
| :--- | :--- | :--- | :--- |
| **Record ID** | Formula | Auto-generated record hash. | Internal Airtable Key |
| **Ticket ID** | Single-line text | Unique identifier for deduplication (email `messageId` or WhatsApp message ID). | **Primary Key for Deduplication (Unique)** |
| **Source** | Single Select | Source channel: `Email` or `WhatsApp`. | Required |
| **Customer Identifier**| Single-line text | Customer address: Sender email or WhatsApp phone number. | Required |
| **Subject** | Single-line text | Email subject (for WhatsApp, set to `[WhatsApp Message]`). | Optional |
| **Raw Message** | Long text | The plain text parsed customer request. | Required |
| **English Translation**| Long text | Translated message text if the original language is not English. | Optional |
| **Detected Language** | Single Select | Customer's preferred/detected language (e.g. `Hindi`, `Tamil`, `Hinglish`). | Required |
| **Topic** | Single Select | Classified topic: `Billing & Payment`, `Product Issue`, `Delivery & Shipping`, `Order Management`, `Account & Login`, `Store & Service`, `Other`. | Required |
| **Urgency** | Single Select | Priority scale: `High`, `Medium`, `Low`. | Required |
| **Location** | Single-line text | Customer's physical city, state, or region if extracted. | Optional |
| **Draft Reply** | Long text | AI-generated reply in the customer's native language. | Optional |
| **Status** | Single Select | Workflow routing status: `New`, `Investigating`, `Draft Ready`, `Replied`, `Closed`, `Failed`, `Processing`. | Defaults to `New` |
| **Resync** | Checkbox | Manually trigger reprocessing of failed tickets. | Resets to unchecked by workflow |
| **Error Log** | Long text | Detailed system stack traces or error summaries for failed sync runs. | Optional |
| **Created Time** | Created time | Timestamp when the record is written to Airtable. | Auto-populated |


---

## 3. Deduplication Mechanism

To prevent processing the same support request twice:
1. Every incoming request extracts a unique **`Ticket ID`** (e.g., Gmail's `messageId` header `<xyz123@mail.gmail.com>`).
2. The n8n workflow queries the Airtable `Tickets` table using the filter formula:
   ```text
   {Ticket ID} = '{{ $json.ticketId }}'
   ```
3. If a record is returned, the workflow terminates immediately.
4. If no records are found, the workflow continues, eventually creating a new row in this table.
