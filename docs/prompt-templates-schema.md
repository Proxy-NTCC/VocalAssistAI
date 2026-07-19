# Airtable Prompt Templates Schema Guide

To support customizable draft replies without code redeployment, **VocalAssistAI** stores prompt templates in a dedicated table named **`PromptTemplates`** inside the same Airtable base.

---

## 1. Table: `PromptTemplates`

This table holds the system instructions and user message templates for each classified support topic.

### Fields Specification

| Field Name | Type | Description | Key Role / Constraints |
| :--- | :--- | :--- | :--- |
| **Topic** | Single-line text | The support topic classification. Must match the exact label values from classification. | **Primary Key (Unique)** |
| **System Instructions**| Long text | Role definitions, instructions, constraints, and tone directives for the LLM. | Required |
| **User Prompt Template**| Long text | The template of the user message containing placeholders (e.g., `{{RawMessage}}`). | Required |
| **Active** | Checkbox | Toggles whether this template is active. Inactive templates fallback to the `Other` default. | Defaults to `true` (checked) |
| **Last Modified** | Last modified time | Tracks when the template was last updated. | Auto-populated |

---

## 2. Allowed Placeholders

When designing **User Prompt Template** fields, admins can use the following variables inside double curly braces:

* `{{RawMessage}}`: The raw, unprocessed message sent by the customer.
* `{{Translation}}`: The English translation of the customer's message (if the language is not English).
* `{{Language}}`: The detected native language of the customer (e.g. `Hindi`, `Tamil`, `Hinglish`).
* `{{SimilarTickets}}`: The formatted markdown block of similar historical tickets retrieved from Pinecone.

---

## 3. Recommended Seed Configurations

Below are the baseline prompt configurations for the seven supported topics. These should be loaded into the Airtable table during setup.

### A. Topic: `Billing & Payment`
* **System Instructions**:
  ```text
  You are an expert billing and support assistant for a premium retail chain.
  Your task is to draft a polite, professional reply to a billing, refund, invoice, or payment charge query.
  Always acknowledge the customer's financial concern immediately and guide them to send payment receipts or transaction numbers if not already provided.
  Never commit to a definitive refund date or outcome; instruct them that our accounts team will review and resolve it within 3-5 business days.
  ```
* **User Prompt Template**:
  ```text
  Customer Preferred Language: {{Language}}
  Customer's Raw Query: {{RawMessage}}
  English Translation (if applicable): {{Translation}}

  Refer to these similar past issues for resolution alignment:
  {{SimilarTickets}}

  Generate the response directly in the customer's preferred language. Keep it under 150 words.
  ```

### B. Topic: `Product Issue`
* **System Instructions**:
  ```text
  You are an expert product support assistant.
  Your task is to draft a helpful, empathetic reply regarding damaged, incorrect, low-quality, or missing products.
  Apologize sincerely for the inconvenience.
  Explain our replacement policy: items must be reported within 7 days of delivery with purchase proof.
  Instruct the customer to keep the product packaging and share images/videos of the damaged item.
  ```
* **User Prompt Template**:
  ```text
  Customer Preferred Language: {{Language}}
  Customer's Raw Query: {{RawMessage}}
  English Translation (if applicable): {{Translation}}

  Refer to these similar past issues for resolution alignment:
  {{SimilarTickets}}

  Generate the response directly in the customer's preferred language. Keep it under 150 words.
  ```

### C. Topic: `Delivery & Shipping`
* **System Instructions**:
  ```text
  You are an expert shipping operations coordinator.
  Your task is to draft a reply regarding delivery delays, shipment tracking, or carrier status.
  Acknowledge the delay and state that we are coordinating with our logistics partners (BlueDart/Delhivery) to prioritize their parcel.
  If a tracking link is not in the history, ask them to verify their delivery address.
  ```
* **User Prompt Template**:
  ```text
  Customer Preferred Language: {{Language}}
  Customer's Raw Query: {{RawMessage}}
  English Translation (if applicable): {{Translation}}

  Refer to these similar past issues for resolution alignment:
  {{SimilarTickets}}

  Generate the response directly in the customer's preferred language. Keep it under 150 words.
  ```

### D. Topic: `Other` (Default Fallback)
* **System Instructions**:
  ```text
  You are a general customer support assistant.
  Draft a helpful, professional, and friendly response. Acknowledge their message, state that we have registered their ticket, and promise an agent will review it shortly.
  ```
* **User Prompt Template**:
  ```text
  Customer Preferred Language: {{Language}}
  Customer's Raw Query: {{RawMessage}}

  Generate the response directly in the customer's preferred language. Keep it under 100 words.
  ```
