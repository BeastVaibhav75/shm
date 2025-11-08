const Appointment = require('../models/Appointment')
const Patient = require('../models/Patient')
const Invoice = require('../models/Invoice')

// Helper to parse dates
const parseDateRange = (req) => {
  const { start, end } = req.query
  const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), 0, 1)
  const endDate = end ? new Date(end) : new Date()
  return { startDate, endDate }
}

exports.getDailyAppointments = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req)
    const pipeline = [
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]
    const data = await Appointment.aggregate(pipeline)
    return res.json({ daily: data })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute daily appointments' })
  }
}

exports.getMostCommonTreatments = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req)
    const patients = await Patient.find({ 'treatmentHistory.date': { $gte: startDate, $lte: endDate } }, { treatmentHistory: 1 }).lean()
    const counts = {}
    for (const p of patients) {
      for (const t of (p.treatmentHistory || [])) {
        if (t.date >= startDate && t.date <= endDate) {
          counts[t.type] = (counts[t.type] || 0) + 1
        }
      }
    }
    const top = Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a,b) => b.count - a.count)
    return res.json({ commonTreatments: top })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute common treatments' })
  }
}

exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req)
    const pipeline = [
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$total' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]
    const summary = await Invoice.aggregate(pipeline)
    return res.json({ monthlyRevenue: summary })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute monthly revenue' })
  }
}

exports.getDoctorPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req)
    // Patients treated: count of treatments per doctor
    const patients = await Patient.find({ 'treatmentHistory.date': { $gte: startDate, $lte: endDate } }, { treatmentHistory: 1 }).lean()
    const perf = {}
    for (const p of patients) {
      for (const t of (p.treatmentHistory || [])) {
        if (t.date >= startDate && t.date <= endDate && t.addedBy) {
          const key = String(t.addedBy)
          perf[key] = perf[key] || { doctor: t.addedBy, patientsTreated: 0, treatments: 0, revenue: 0 }
          perf[key].patientsTreated += 1
          perf[key].treatments += 1
        }
      }
    }
    // Revenue by doctor from invoices
    const revenueAgg = await Invoice.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, doctor: { $ne: null } } },
      { $group: { _id: '$doctor', revenue: { $sum: '$total' } } }
    ])
    for (const r of revenueAgg) {
      const key = String(r._id)
      perf[key] = perf[key] || { doctor: r._id, patientsTreated: 0, treatments: 0, revenue: 0 }
      perf[key].revenue = r.revenue
    }
    const result = Object.values(perf)
    return res.json({ doctorPerformance: result })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute doctor performance' })
  }
}

exports.getRetentionAndFollowUp = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req)
    // Retention: patients with >1 appointment in range over total with >=1
    const appts = await Appointment.find({ date: { $gte: startDate, $lte: endDate } }, { patient: 1, type: 1, status: 1 }).lean()
    const countsByPatient = {}
    let followUpScheduled = 0
    let followUpCompleted = 0
    for (const a of appts) {
      const key = String(a.patient)
      countsByPatient[key] = (countsByPatient[key] || 0) + 1
      if (a.type === 'follow-up') {
        followUpScheduled += 1
        if (a.status === 'completed') followUpCompleted += 1
      }
    }
    const totalWithOne = Object.values(countsByPatient).filter(c => c >= 1).length
    const returning = Object.values(countsByPatient).filter(c => c > 1).length
    const retentionRate = totalWithOne ? Math.round((returning / totalWithOne) * 100) : 0
    const followUpSuccess = followUpScheduled ? Math.round((followUpCompleted / followUpScheduled) * 100) : 0
    return res.json({ retentionRate, followUpSuccess, followUpScheduled, followUpCompleted })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute retention and follow-up' })
  }
}

exports.getOutstandingPayments = async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: { $ne: 'Paid' } }, { total: 1, status: 1 }).lean()
    const count = invoices.length
    const amount = invoices.reduce((sum, i) => sum + (i.total || 0), 0)
    return res.json({ outstanding: { count, amount } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute outstanding payments' })
  }
}