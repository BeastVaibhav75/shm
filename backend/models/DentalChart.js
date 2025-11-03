const mongoose = require('mongoose');

const toothSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    // Supports both FDI (11-48) and Universal (1-32) numbering systems
  },
  condition: {
    type: String,
    enum: ['healthy', 'decayed', 'filled', 'missing', 'crown', 'implant', 'root_canal', 'bridge', 'extraction_needed', 'other'],
    default: 'healthy'
  },
  notes: {
    type: String,
    default: ''
  },
  treatments: [{
    type: {
      type: String,
      enum: ['filling', 'extraction', 'root_canal', 'crown', 'cleaning', 'other'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  images: [{
    type: {
      type: String,
      enum: ['xray', 'clinical', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: String
  }]
});

const dentalChartSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  teeth: [toothSchema],
  notationSystem: {
    type: String,
    enum: ['fdi', 'universal'],
    default: 'fdi'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create index for faster patient lookup
dentalChartSchema.index({ patient: 1 });

module.exports = mongoose.model('DentalChart', dentalChartSchema);