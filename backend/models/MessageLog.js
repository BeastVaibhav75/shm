const mongoose = require('mongoose')

const messageLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['appointment_reminder', 'feedback', 'birthday', 'anniversary', 'custom'], required: true },
  channel: { type: String, enum: ['whatsapp', 'sms'], default: 'whatsapp' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  treatmentRecordId: { type: mongoose.Schema.Types.ObjectId },
  content: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  response: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true })

messageLogSchema.index({ type: 1, patient: 1, sentAt: -1 })

module.exports = mongoose.model('MessageLog', messageLogSchema)