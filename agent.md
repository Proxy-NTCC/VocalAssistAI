# VocalAssistAI: Vernacular Ticket Routing & Multilingual Support Automation

VocalAssistAI is an AI-powered vernacular customer support system designed for Tier 2/3 retail chains. It automates ingestion of multilingual support requests from Email and WhatsApp, performs language detection, classification, translation, and routes them to Airtable dashboards. It integrates vector search (Pinecone) to fetch historical resolutions and drafts automated replies.

---

## 1. Project Structure

The project is structured with a React Frontend, Express/Node.js Backend, MongoDB for persistence, and n8n/Airtable/Pinecone for automation and search.

```
VocalAIAssistant/
├── agent.md                        # Project documentation and architectural plan
├── Backend/
│   └── backend-26/
│       └── backend-26/
│           ├── app.js              # Express app entrypoint
│           ├── package.json        # Node.js backend dependencies
│           ├── .env                # Backend environment configuration
│           ├── bin/
│           │   └── www             # Web server entry script
│           ├── config/
│           │   └── db.js           # MongoDB connection utility
│           ├── models/             # Mongoose schemas
│           │   ├── Ticket.js       # Customer tickets model
│           │   └── Resolution.js   # Resolution cache & knowledge base
│           └── routes/             # Backend API routing
│               └── tickets.js      # Ticket endpoints (create, fetch, update)
└── Frontend/
    └── Frontend/
        └── Frontend-Demo/
            ├── package.json        # Frontend configuration and dependencies
            ├── vite.config.ts      # Vite bundler config
            ├── src/                # React source code
            │   ├── main.tsx        # React entrypoint
            │   ├── App.tsx         # Main layout & routing container
            │   ├── index.css       # Global styles (Tailwind/Custom CSS)
            │   ├── components/     # Reusable UI components
            │   │   ├── TicketCard.tsx
            │   │   ├── StatusBadge.tsx
            │   │   └── LanguageBadge.tsx
            │   └── pages/          # Application views/pages
            │       ├── Dashboard.tsx    # Main tickets overview page
            │       ├── TicketDetail.tsx # Detailed view & reply editor
            │       └── Settings.tsx     # n8n & Airtable configurations
```

---

## 2. Technology Stack & Integrations

- **Frontend**: React (Vite, TypeScript, TailwindCSS/Vanilla CSS, Lucide icons, Axios)
- **Backend**: Express.js (Node.js), Mongoose (MongoDB)
- **Database**: MongoDB (Atlas)
- **Automation Pipeline**: n8n workflow engine
- **Ticket Dashboard / CRM**: Airtable base & tables
- **Vector Database**: Pinecone (for ticket embeddings and similarity matches)
- **AI Models**: Google Gemini / OpenAI via n8n LLM nodes (for detection, routing, response drafting)

---

## 3. Database Schema Design (MongoDB)

### 3.1. Ticket Schema (`models/Ticket.js`)
```javascript
const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  originalId: { type: String }, // WhatsApp message ID or Email UID
  channel: { type: String, enum: ['Email', 'WhatsApp'], required: true },
  customerName: { type: String, default: 'Anonymous' },
  customerContact: { type: String, required: true }, // Email or Phone number
  originalLanguage: { type: String, default: 'en' },
  subject: { type: String },
  rawContent: { type: String, required: true },
  translatedContent: { type: String },
  category: { type: String, default: 'General' }, // Order, Refund, Delivery, Product, etc.
  urgency: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  location: { type: String, default: 'Unknown' },
  status: { type: String, enum: ['New', 'In Progress', 'Resolved'], default: 'New' },
  airtableRecordId: { type: String },
  draftReply: { type: String },
  similarResolvedTickets: [{ type: String }], // Pinecone reference IDs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);
```

---

## 4. Page-Wise Frontend Development Details

### 4.1. Dashboard Page (`pages/Dashboard.tsx`)
- **Purpose**: Displays lists of incoming multilingual tickets categorized by urgency, topic, and location.
- **Key Features**:
  - Stat counters (New Tickets, Open Tickets, Language Distribution, Avg Resolution Time).
  - Ticket Feed: Real-time update of tickets coming from WhatsApp/Email.
  - Multi-select filters (Filter by Channel, Status, Urgency, Original Language, Location).
  - Quick action buttons (Translate, Assign, Route to Airtable).

### 4.2. Ticket Detail Page (`pages/TicketDetail.tsx`)
- **Purpose**: Provides full conversational view and resolution interface for a single ticket.
- **Key Features**:
  - Raw client text and Auto-translated English translation side-by-side.
  - Intent classification and Urgency visualization.
  - Historical context panel: Fetched top 3 similar past tickets from Pinecone/MongoDB.
  - Generated draft response in the client's original language.
  - Live response edit and submit (sends email draft or WhatsApp reply).

### 4.3. Settings Page (`pages/Settings.tsx`)
- **Purpose**: Manage API keys, webhook URLs, and external system integrations.
- **Key Features**:
  - Airtable Base ID, Table Name, and Personal Access Token (PAT) config.
  - n8n Webhook Endpoint status indicator.
  - Pinecone index setup verification.
  - Email (SMTP/IMAP) and WhatsApp (API/Meta Developer Account) settings.

---

## 5. Workflow Automation Plan (n8n)

1. **Ingress**: WhatsApp Webhook / IMAP Email Trigger node.
2. **Detection & Extraction**: Extract customer name, contact details, subject, and body.
3. **AI Agent Pipeline**:
   - **Language Detector Node**: Identifies the vernacular language (Hindi, Tamil, Telugu, Kannada, Bengali, etc.).
   - **Translation Node**: Translates query to English for internal routing.
   - **Classification Node**: Classifies the category, location, and urgency.
4. **Vector DB (Pinecone)**: Query Pinecone index using embeddings of the English translation to locate the top 3 similar historical ticket resolutions.
5. **Draft Generation**: Prompt LLM to draft a reply using the retrieved resolutions, matching the client's language and tone.
6. **Airtable Sink**: Write the ticket fields, translation, category, urgency, location, similar tickets, and draft reply into Airtable.
7. **Database Sink**: Notify backend API to update the MongoDB tickets store and trigger frontend dashboard updates.
