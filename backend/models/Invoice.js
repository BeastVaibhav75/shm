const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 }
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['cash', 'card', 'upi', 'bank'], default: 'cash' },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' }
});

const invoiceSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  treatmentRecordId: { type: mongoose.Schema.Types.ObjectId },
  items: { type: [invoiceItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Partially Paid', 'Pending'], default: 'Pending' },
  payments: { type: [paymentSchema], default: [] },
  issuedAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Calculate amounts before save
invoiceSchema.pre('save', function(next) {
  this.subtotal = (this.items || []).reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
  this.gstAmount = Math.round((this.subtotal * (this.gstPercent || 0)) ) / 100;
  this.discountAmount = Math.round((this.subtotal * (this.discountPercent || 0)) ) / 100;
  this.total = Math.max(0, this.subtotal + this.gstAmount - this.discountAmount);

  const paid = (this.payments || []).reduce((sum, p) => sum + p.amount, 0);
  if (paid <= 0) this.status = 'Pending';
  else if (paid < this.total) this.status = 'Partially Paid';
  else this.status = 'Paid';
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);