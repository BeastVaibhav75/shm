const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  }
});

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicines: [medicineSchema],
  generalInstructions: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date
  },
  sentVia: [{
    type: String,
    enum: ['whatsapp', 'email', 'print', 'none'],
    default: 'none'
  }],
  digitalSignature: {
    type: String
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ appointment: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);