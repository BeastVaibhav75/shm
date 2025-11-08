const mongoose = require('mongoose');

const treatmentStepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  plannedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  completedDate: {
    type: Date
  },
  cost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  teethInvolved: [{
    type: String
  }]
});

const treatmentPlanSchema = new mongoose.Schema({
  caseId: {
    type: String,
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  steps: [treatmentStepSchema],
  totalCost: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number, // in days
    default: 1
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  progress: {
    type: Number, // percentage
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
treatmentPlanSchema.index({ patient: 1 });
treatmentPlanSchema.index({ doctor: 1 });
treatmentPlanSchema.index({ status: 1 });
treatmentPlanSchema.index({ caseId: 1 });

module.exports = mongoose.model('TreatmentPlan', treatmentPlanSchema);