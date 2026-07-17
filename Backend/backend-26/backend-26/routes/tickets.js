const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// CREATE a new ticket (typically called by webhook/n8n/ingress pipeline)
router.post('/', async (req, res) => {
  try {
    const newTicket = new Ticket(req.body);
    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (err) {
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

module.exports = router;
