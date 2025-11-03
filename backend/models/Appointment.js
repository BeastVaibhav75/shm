const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled', 'rescheduled'],
    default: 'confirmed'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duration: {
    type: Number,
    default: 30 // in minutes
  },
  type: {
    type: String,
    enum: ['consultation', 'treatment', 'follow-up', 'emergency'],
    default: 'consultation'
  }
}, {
  timestamps: true
});

// Index for better query performance
appointmentSchema.index({ date: 1, doctor: 1 });
appointmentSchema.index({ patient: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
