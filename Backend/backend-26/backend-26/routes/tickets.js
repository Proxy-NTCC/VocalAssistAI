const express = require('express');
const router = express.Router();
const https = require('https');
const Ticket = require('../models/Ticket');

// CREATE a new ticket (typically called by webhook/n8n/ingress pipeline)
router.post('/', async (req, res) => {
  try {
    const newTicket = new Ticket(req.body);
    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (err) {
    const ticketId = req.body._id || req.body.originalId || 'new';
    console.error(`[Backend Ticket Ingestion Error] Failed to ingest ticket. Ticket ID: "${ticketId}". Step: Ingestion. Error: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
});

// READ ALL tickets with advanced filtering support (channel, status, urgency, originalLanguage, location, category)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const queryFields = ['channel', 'status', 'urgency', 'originalLanguage', 'location', 'category'];

    queryFields.forEach((field) => {
      if (req.query[field]) {
        filter[field] = req.query[field];
      }
    });

    // Support sorting (default to newest first)
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const tickets = await Ticket.find(filter).sort({ [sortBy]: order });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ a single ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE a ticket by ID (updating draft reply, category, status, urgency, location, etc.)
router.put('/:id', async (req, res) => {
  try {
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(updatedTicket);
  } catch (err) {
    console.error(`[Backend Ticket Update Error] Failed to update ticket. Ticket ID: "${req.params.id}". Step: Update. Error: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
});

// DELETE a ticket by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);
    if (!deletedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper to sync feedback to a dedicated Airtable table
const syncFeedbackToAirtable = (ticket, feedbackItem, credentials) => {
  const baseId = credentials.baseId || process.env.AIRTABLE_BASE_ID;
  const pat = credentials.pat || process.env.AIRTABLE_PAT;
  const tableName = credentials.tableName || 'Feedback';

  if (!baseId || !pat || pat.startsWith('pat_vocal_assist_secret_key')) {
    console.log('Skipping Airtable feedback sync: Credentials missing or mock key detected.');
    return Promise.resolve(false);
  }

  const fields = {
    "Ticket ID": ticket._id.toString(),
    "Retrieval Event ID": feedbackItem.retrievalEventId || `retrieval_${ticket._id}`,
    "Reference Set": Array.isArray(feedbackItem.referenceSet) ? feedbackItem.referenceSet.join(', ') : (ticket.similarResolvedTickets || []).join(', '),
    "Ticket Channel": ticket.channel || "",
    "Customer Contact": ticket.customerContact || "",
    "Resolution ID": feedbackItem.resolutionId,
    "Rating": feedbackItem.rating === "up" ? "Thumbs Up" : "Thumbs Down",
    "Category": feedbackItem.category || "",
    "Query Text": feedbackItem.queryText || "",
    "Comments": feedbackItem.comment || "",
    "Timestamp": new Date(feedbackItem.ratedAt).toISOString()
  };

  if (ticket.airtableRecordId) {
    fields["Ticket Link"] = [ticket.airtableRecordId];
  }

  const postData = JSON.stringify({
    records: [{ fields }]
  });

  const options = {
    hostname: 'api.airtable.com',
    port: 443,
    path: `/v0/${baseId}/${encodeURIComponent(tableName)}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Successfully logged feedback in Airtable table "${tableName}".`);
          resolve(true);
        } else {
          console.error(`[Backend Airtable Sync Error] Airtable feedback sync returned error status. Ticket ID: "${ticket._id}". Step: Airtable Sync. Error: HTTP Status ${res.statusCode}. Response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`[Backend Airtable Sync Error] Network error syncing feedback to Airtable. Ticket ID: "${ticket._id}". Step: Airtable Sync. Error: ${e.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
};

// SUBMIT/UPDATE feedback on similar resolution retrieval
router.post('/:id/feedback', async (req, res) => {
  try {
    const { resolutionId, rating, category, queryText, comment, retrievalEventId, referenceSet, airtableBaseId, airtablePat } = req.body;
    if (!resolutionId || !rating) {
      return res.status(400).json({ message: 'resolutionId and rating are required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Determine event ID and reference set for retrieval tracking
    const eventId = retrievalEventId || `retrieval_${ticket._id}_${category || ticket.category || 'gen'}`;
    const refSet = Array.isArray(referenceSet) && referenceSet.length > 0
      ? referenceSet
      : (ticket.similarResolvedTickets && ticket.similarResolvedTickets.length > 0 ? ticket.similarResolvedTickets : [resolutionId]);

    // Initialize array if not exists
    if (!ticket.referenceFeedback) {
      ticket.referenceFeedback = [];
    }

    // Check if feedback for this resolutionId already exists
    const existingIndex = ticket.referenceFeedback.findIndex(
      (f) => f.resolutionId === resolutionId
    );

    let feedbackItem;

    if (existingIndex > -1) {
      // Update existing feedback
      ticket.referenceFeedback[existingIndex].rating = rating;
      ticket.referenceFeedback[existingIndex].retrievalEventId = eventId;
      ticket.referenceFeedback[existingIndex].referenceSet = refSet;
      ticket.referenceFeedback[existingIndex].category = category || ticket.referenceFeedback[existingIndex].category;
      ticket.referenceFeedback[existingIndex].queryText = queryText || ticket.referenceFeedback[existingIndex].queryText;
      if (comment !== undefined) {
        ticket.referenceFeedback[existingIndex].comment = comment;
      }
      ticket.referenceFeedback[existingIndex].ratedAt = Date.now();
      feedbackItem = ticket.referenceFeedback[existingIndex];
    } else {
      // Add new feedback entry
      const newFeedback = {
        resolutionId,
        rating,
        retrievalEventId: eventId,
        referenceSet: refSet,
        category,
        queryText,
        comment: comment || '',
        ratedAt: Date.now()
      };
      ticket.referenceFeedback.push(newFeedback);
      feedbackItem = newFeedback;
    }

    const savedTicket = await ticket.save();

    // Trigger Airtable sync in the background
    syncFeedbackToAirtable(savedTicket, feedbackItem, {
      baseId: airtableBaseId,
      pat: airtablePat,
      tableName: 'Feedback'
    }).catch(err => console.error(`[Backend Airtable Sync Error] Failed to sync feedback to Airtable for ticket ${req.params.id}:`, err));

    res.json(savedTicket);
  } catch (err) {
    console.error(`[Backend Feedback Error] Failed to log feedback. Ticket ID: "${req.params.id}". Step: Submit Feedback. Error: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
});

// POST /tickets/errors - Receives error logs from n8n error handling sub-workflow
router.post('/errors', async (req, res) => {
  try {
    const errorLog = req.body;
    console.error(`[n8n Workflow Error Logged] Timestamp: ${errorLog.timestamp || new Date().toISOString()} | Workflow: "${errorLog.workflowName || 'N/A'}" | Node: "${errorLog.failedNodeName || 'N/A'}" | Message: "${errorLog.errorMessage || 'N/A'}" | Ticket ID: "${errorLog.ticketId || 'N/A'}"`);
    res.status(201).json({ status: 'logged', errorLog });
  } catch (err) {
    console.error('[Backend Log Endpoint Error]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
