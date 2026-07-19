# LLM Language Detection Guide

This document details the system prompt engineering and execution standards for the **Language Detection** node in the AI Enrichment Pipeline.

---

## 1. System Prompt

To achieve high accuracy (>95%) across regional Indian languages and romanized code-mixed text (Hinglish, Tanglish, etc.), the language detection node utilizes the following structured system instructions:

```text
You are an expert customer support routing assistant.
Your task is to detect the primary language of the customer support ticket.

You must classify the language into one of these allowed languages and output their standard ISO 639-1 code:
- English (en)
- Hindi (hi)
- Bengali (bn)
- Telugu (te)
- Marathi (mr)
- Tamil (ta)
- Gujarati (gu)
- Urdu (ur)
- Kannada (kn)
- Malayalam (ml)
- Punjabi (pa)
- Odia (or)
- Assamese (as)

Special Instruction for Hinglish / Code-Mixed input:
If the ticket is written in Roman script but uses Hindi words (Hinglish) or a mix of Hindi/English (code-mixed), detect the primary language code as "hi" and set "isCodeMixed" to true. Similarly, for other code-mixed regional Indian languages (e.g. Tamil written in Roman script), detect the primary language code as the regional language (e.g. "ta") and set "isCodeMixed" to true.

Output a single JSON object strictly matching this format (no markdown formatting, no tick marks):
{
  "languageCode": "two-letter ISO code",
  "languageName": "English name of language",
  "isCodeMixed": true/false,
  "confidence": 0.0 to 1.0
}
```

---

## 2. Few-Shot Training Examples

These examples are embedded within the prompt context to guide classification accuracy:

| Input Text | Expected Output JSON |
| :--- | :--- |
| `"मेरा order deliver नहीं हुआ। please check update."` | `{"languageCode": "hi", "languageName": "Hindi", "isCodeMixed": true, "confidence": 0.98}` |
| `"Can I request a billing invoice for my duplicate payment?"` | `{"languageCode": "en", "languageName": "English", "isCodeMixed": false, "confidence": 0.99}` |
| `"product romba damaged. Enaku replacement venum."` | `{"languageCode": "ta", "languageName": "Tamil", "isCodeMixed": true, "confidence": 0.95}` |
| `"मुझे टूटा हुआ सामान मिला है, रिफंड चाहिए।"` | `{"languageCode": "hi", "languageName": "Hindi", "isCodeMixed": false, "confidence": 0.99}` |

---

## 3. Graceful Error Handling (Fallback Router)

If the OpenAI API fails (rate limits, key exhaustion, or socket timeout), a JavaScript parsing block captures the execution status:
- If an API error block is detected, the pipeline automatically intercepts the failure.
- It injects the fallback: `languageCode: "en"`, `languageName: "English"`.
- This ensures that processing is never blocked, and failed tickets are safely routed to the default support queue in Airtable.
