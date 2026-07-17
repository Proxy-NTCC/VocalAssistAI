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

// Update the updatedAt timestamp before saving
TicketSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);
