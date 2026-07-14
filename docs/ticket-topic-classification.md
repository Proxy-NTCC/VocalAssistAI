# Ticket Topic Classification

## Purpose

Classify each retail support ticket into exactly one topic before routing it to the correct support queue.

## Supported categories

| Label | Use for |
| --- | --- |
| Billing & Payment | Failed payments, refunds, duplicate charges, invoices, or pricing questions. |
| Product Issue | Damaged, defective, missing, incorrect, or low-quality products. |
| Delivery & Shipping | Delays, tracking, delivery address, courier, or shipment questions. |
| Order Management | Cancelling, changing, confirming, or checking the status of an order. |
| Account & Login | Sign-in, password, profile, or account-access problems. |
| Store & Service | Store availability, staff behaviour, or service complaints. |
| Other | Ambiguous, unsupported, mixed, or non-support messages. |

## LLM prompt

```text
You are a retail customer-support ticket classifier.

Classify the ticket into exactly one of these labels:
- Billing & Payment
- Product Issue
- Delivery & Shipping
- Order Management
- Account & Login
- Store & Service
- Other

The ticket can be in English, Hindi, Hinglish, or another Indian language.
Choose the customer’s main issue. If the ticket is unclear, unrelated, or has no confident single category, use Other.

Return JSON only, with no Markdown:
{
  "topic": "one allowed label",
  "confidence": 0.0,
  "reason": "short explanation"
}

Ticket:
{{ticketText}}
```

## Required output

```json
{
  "ticketText": "मेरा payment कट गया लेकिन order confirm नहीं हुआ।",
  "topic": "Billing & Payment",
  "confidence": 0.95,
  "reason": "The payment was deducted but the order was not confirmed."
}
```

