const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// GET all expenses, optionally filter by month/year
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.month && req.query.year) {
      const month = parseInt(req.query.month); // 1-based
      const year = parseInt(req.query.year);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all unique product names (for autocomplete dropdown)
router.get('/products', async (req, res) => {
  try {
    const names = await Expense.distinct('productName');
    res.json(names.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create expense
router.post('/', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
