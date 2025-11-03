const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);