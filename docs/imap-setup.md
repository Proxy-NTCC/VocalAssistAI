# IMAP Email Setup Guide

This guide details how to configure secure IMAP email ingestion for **VocalAssistAI** inside n8n.

---

## 1. Prerequisites (Obtaining Credentials)

Modern email providers (Gmail, Microsoft 365) have deprecated plain password authentication for IMAP. You must use an **App Password** or **OAuth2**.

### Gmail Setup (Recommended)
1. Go to your **Google Account settings** (https://myaccount.google.com).
2. Navigate to the **Security** tab.
3. Under *How you sign in to Google*, ensure **2-Step Verification** is enabled.
4. Click on **2-Step Verification** -> Scroll down to the bottom -> Click **App passwords**.
5. Enter a name (e.g., `n8n VocalAssistAI`) and click **Create**.
6. Copy the generated **16-character password**. Keep this password private.

### Microsoft Outlook Setup
1. Log in to your Microsoft Account (Security settings).
2. Go to **Advanced Security Options**.
3. Under *App Passwords*, select **Create a new app password**.
4. Copy the generated code.

---

## 2. Environment Configuration

Add the connection values to your local `.env` file (copied from `.env.example`):

```properties
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-support-email@gmail.com
IMAP_PASSWORD=abcd-efgh-ijkl-mnop # Your 16-character App Password (no spaces)
```

---

## 3. Configuring n8n Credential Manager

1. Open n8n UI at `http://localhost:5679`.
2. Go to **Credentials** -> **Add Credential** -> Search for `IMAP`.
3. Fill in the fields using the settings from your `.env`:
   - **User:** `your-support-email@gmail.com`
   - **Password:** `abcd-efgh-ijkl-mnop` (App Password)
   - **Host:** `imap.gmail.com`
   - **Port:** `993`
   - **SSL/TLS:** Enable (Checked)
4. Click **Save** / **Test Connection** to verify connection status.

---

## 4. Setting Polling & Ingestion Frequencies

By default, the `IMAP Email Trigger` node in `workflows/email-ingestion.json` uses the IMAP **IDLE** protocol. 

### IMAP IDLE (Real-time, Recommended)
* **What it does:** The connection stays open, and the email server pushes new emails to n8n instantly as they arrive.
* **Benefit:** Emails trigger the workflow in under **5 seconds**, easily satisfying the `< 2 minutes` acceptance criteria.
* **Setup:** Set the node property `On Email Received` to `nothing` (it processes the email and keeps it in the inbox) or `markAsRead` / `flag` to prevent reprocessing.

### Short Polling (Fallback)
If your email provider does not support `IDLE`, you can change the node settings to poll at specified intervals:
1. Open the **IMAP Email Trigger** node in the n8n UI.
2. Change the trigger property if your provider needs interval checking.
3. However, IMAP IDLE is supported by default on all major retail support mail hosts (Gmail, Outlook, Yahoo).
