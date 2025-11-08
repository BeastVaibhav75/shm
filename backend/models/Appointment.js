const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true,
    index: true
  },
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

// Helper to pad numbers
function pad(num, size) {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

// Generate Case ID: SHD-YYYYMM-XXX
appointmentSchema.pre('save', async function(next) {
  if (this.caseId) return next();
  try {
    const now = new Date(this.date || Date.now());
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1, 2);
    const prefix = `SHD-${year}${month}-`;

    // Count existing for this year-month to create incremental
    const regex = new RegExp(`^${prefix}`);
    const count = await mongoose.model('Appointment').countDocuments({ caseId: { $regex: regex } });
    const nextSeq = pad(count + 1, 3);
    this.caseId = `${prefix}${nextSeq}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
