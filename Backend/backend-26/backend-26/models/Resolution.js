const mongoose = require('mongoose');

const ResolutionSchema = new mongoose.Schema({
  category: { type: String, required: true }, // Order, Refund, Delivery, Product, etc.
  issueDescription: { type: String, required: true }, // Summary or raw issue text in English
  resolutionText: { type: String, required: true }, // Recommended solution response
  keywords: [{ type: String }], // Tags for secondary search/classification
  pineconeVectorId: { type: String }, // Reference to corresponding vector embedding in Pinecone
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
ResolutionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resolution', ResolutionSchema);
