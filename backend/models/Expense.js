const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, default: 0 },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
