const express = require('express');
const router = express.Router();
const Resolution = require('../models/Resolution');

// CREATE a new resolution (adding to knowledge base)
router.post('/', async (req, res) => {
  try {
    const newResolution = new Resolution(req.body);
    const savedResolution = await newResolution.save();
    res.status(201).json(savedResolution);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ ALL resolutions (with optional category filter)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const resolutions = await Resolution.find(filter);
    res.json(resolutions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ a single resolution by ID
router.get('/:id', async (req, res) => {
  try {
    const resolution = await Resolution.findById(req.params.id);
    if (!resolution) {
      return res.status(404).json({ message: 'Resolution not found' });
    }
    res.json(resolution);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE a resolution by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedResolution = await Resolution.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedResolution) {
      return res.status(404).json({ message: 'Resolution not found' });
    }
    res.json(updatedResolution);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a resolution by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedResolution = await Resolution.findByIdAndDelete(req.params.id);
    if (!deletedResolution) {
      return res.status(404).json({ message: 'Resolution not found' });
    }
    res.json({ message: 'Resolution deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
