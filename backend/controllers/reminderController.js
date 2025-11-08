const Appointment = require('../models/Appointment')
const Patient = require('../models/Patient')
const MessageLog = require('../models/MessageLog')
const whatsapp = require('../utils/whatsapp')

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

exports.sendUpcomingAppointmentReminders = async (req, res) => {
  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const start = startOfDay(tomorrow)
    const end = endOfDay(tomorrow)

    const appts = await Appointment.find({ date: { $gte: start, $lte: end }, status: 'confirmed' })
      .populate('patient')
      .populate('doctor')
      .lean()

    const results = []
    for (const a of appts) {
      const content = `Reminder: Your appointment is scheduled on ${a.date.toLocaleDateString()} at ${a.time} with Dr. ${a.doctor?.name || ''}.`
      try {
        await whatsapp.sendAppointmentReminder(a.patient?.contact, content)
        const log = await MessageLog.create({ type: 'appointment_reminder', channel: 'whatsapp', patient: a.patient?._id, doctor: a.doctor?._id, appointment: a._id, content, status: 'sent' })
        results.push({ appointment: a._id, status: 'sent', logId: log._id })
      } catch (err) {
        const log = await MessageLog.create({ type: 'appointment_reminder', channel: 'whatsapp', patient: a.patient?._id, doctor: a.doctor?._id, appointment: a._id, content, status: 'failed', response: String(err.message || err) })
        results.push({ appointment: a._id, status: 'failed', error: err.message, logId: log._id })
      }
    }

    return res.json({ count: results.length, results })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to send upcoming appointment reminders' })
  }
}

exports.sendPostTreatmentFeedback = async (req, res) => {
  try {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const start = startOfDay(yesterday)
    const end = endOfDay(yesterday)

    const patients = await Patient.find({ 'treatmentHistory.date': { $gte: start, $lte: end } }, { name: 1, contact: 1, treatmentHistory: 1 }).lean()
    const results = []
    for (const p of patients) {
      for (const t of (p.treatmentHistory || [])) {
        if (t.date >= start && t.date <= end) {
          const content = `Hope you are feeling better after your ${t.type}. Please share your feedback.`
          try {
            await whatsapp.sendTreatmentCompletionNotification(p.contact, content)
            const log = await MessageLog.create({ type: 'feedback', channel: 'whatsapp', patient: p._id, treatmentRecordId: t._id, content, status: 'sent' })
            results.push({ patient: p._id, treatmentRecordId: t._id, status: 'sent', logId: log._id })
          } catch (err) {
            const log = await MessageLog.create({ type: 'feedback', channel: 'whatsapp', patient: p._id, treatmentRecordId: t._id, content, status: 'failed', response: String(err.message || err) })
            results.push({ patient: p._id, treatmentRecordId: t._id, status: 'failed', error: err.message, logId: log._id })
          }
        }
      }
    }

    return res.json({ count: results.length, results })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to send post-treatment feedback messages' })
  }
}

exports.sendBirthdayGreetings = async (req, res) => {
  try {
    const now = new Date()
    const today = startOfDay(now)
    const tomorrow = endOfDay(now)

    const patients = await Patient.find({ dateOfBirth: { $gte: today, $lte: tomorrow } }, { name: 1, contact: 1, dateOfBirth: 1 }).lean()
    const results = []
    for (const p of patients) {
      const content = `Happy Birthday, ${p.name}! Wishing you a healthy year ahead. — Shuchi Dental`
      try {
        await whatsapp.sendWhatsAppMessage(p.contact, content)
        const log = await MessageLog.create({ type: 'birthday', channel: 'whatsapp', patient: p._id, content, status: 'sent' })
        results.push({ patient: p._id, status: 'sent', logId: log._id })
      } catch (err) {
        const log = await MessageLog.create({ type: 'birthday', channel: 'whatsapp', patient: p._id, content, status: 'failed', response: String(err.message || err) })
        results.push({ patient: p._id, status: 'failed', error: err.message, logId: log._id })
      }
    }

    return res.json({ count: results.length, results })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to send birthday greetings' })
  }
}

exports.listMessageLogs = async (req, res) => {
  try {
    const { start, end, type } = req.query
    const filter = {}
    if (start || end) {
      filter.sentAt = {}
      if (start) filter.sentAt.$gte = new Date(start)
      if (end) filter.sentAt.$lte = new Date(end)
    }
    if (type) filter.type = type

    const logs = await MessageLog.find(filter).sort({ sentAt: -1 }).limit(200)
      .populate('patient', 'name contact')
      .populate('doctor', 'name')
      .populate('appointment', 'date time status')
    return res.json({ logs })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to list message logs' })
  }
}