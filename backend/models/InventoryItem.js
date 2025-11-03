const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  quantity: { type: Number, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  treatmentRecordId: { type: mongoose.Schema.Types.ObjectId }
});

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, unique: true, sparse: true },
  quantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'pcs' },
  reorderLevel: { type: Number, default: 0 },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  cost: { type: Number, default: 0 },
  lastPurchasedAt: { type: Date },
  usageHistory: { type: [usageSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);