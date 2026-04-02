const mongoose = require('mongoose');

const treatmentRecordSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'Root Canal',
      'Cleaning',
      'Filling',
      'Extraction',
      'Crown',
      'Bridge',
      'Dentures',
      'Orthodontics',
      'Gum Treatment',
      'Consultation',
      'Other'
    ]
  },
  notes: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cost: {
    type: Number,
    default: 0
  },
  usedItems: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    quantity: { type: Number, default: 0 }
  }],
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }
});

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  guardianName: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  issue: {
    type: String,
    required: true
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  treatmentHistory: [treatmentRecordSchema],
  address: {
    type: String,
    default: ''
  },
  emergencyContact: {
    type: String,
    default: ''
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  allergies: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  anniversaryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better search performance
patientSchema.index({ name: 'text', contact: 'text', issue: 'text' });

patientSchema.pre('validate', async function (next) {
  try {
    if (this.guardianName == null) this.guardianName = '';

    if (this.patientId) return next();

    const year = new Date().getFullYear();
    const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    const time = () => Date.now().toString(36).toUpperCase().slice(-6);

    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = `SDH-${year}-${time()}${rand()}`;
      const exists = await this.constructor.exists({ patientId: candidate });
      if (!exists) {
        this.patientId = candidate;
        return next();
      }
    }

    return next(new Error('Failed to generate unique patientId'));
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('Patient', patientSchema);
