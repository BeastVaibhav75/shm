const Patient = require('../models/Patient')
const Appointment = require('../models/Appointment')
const InventoryItem = require('../models/InventoryItem')
const Expense = require('../models/Expense')
const Invoice = require('../models/Invoice')

const parseRange = (req) => {
  const { start, end } = req.query
  const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), 0, 1)
  const endDate = end ? new Date(end) : new Date()
  return { startDate, endDate }
}

exports.monthlyPatientSummary = async (req, res) => {
  try {
    const { startDate, endDate } = parseRange(req)
    const patientsAgg = await Patient.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, newPatients: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
    const apptsAgg = await Appointment.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, appointments: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
    return res.json({ monthlyPatientSummary: { newPatientsByMonth: patientsAgg, appointmentsByMonth: apptsAgg } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to build monthly patient summary' })
  }
}

exports.treatmentWiseRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = parseRange(req)
    const invoices = await Invoice.find({ createdAt: { $gte: startDate, $lte: endDate } }, { patient: 1, treatmentRecordId: 1, total: 1 }).lean()
    const byType = {}
    const patientIds = [...new Set(invoices.map(i => String(i.patient)))]
    const patients = await Patient.find({ _id: { $in: patientIds } }, { treatmentHistory: 1 }).lean()
    const historyByPatient = new Map()
    for (const p of patients) historyByPatient.set(String(p._id), p.treatmentHistory || [])
    for (const inv of invoices) {
      const hist = historyByPatient.get(String(inv.patient)) || []
      const found = hist.find(h => String(h._id) === String(inv.treatmentRecordId))
      const type = found?.type || 'Unknown'
      byType[type] = (byType[type] || 0) + (inv.total || 0)
    }
    const result = Object.entries(byType).map(([type, revenue]) => ({ type, revenue }))
    return res.json({ treatmentRevenue: result })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute treatment-wise revenue' })
  }
}

exports.doctorWisePerformance = async (req, res) => {
  try {
    const { startDate, endDate } = parseRange(req)
    const invAgg = await Invoice.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, doctor: { $ne: null } } },
      { $group: { _id: '$doctor', revenue: { $sum: '$total' }, invoices: { $sum: 1 } } }
    ])
    const apptAgg = await Appointment.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$doctor', appointments: { $sum: 1 } } }
    ])
    const perf = {}
    for (const a of apptAgg) {
      perf[String(a._id)] = { doctor: a._id, appointments: a.appointments, revenue: 0, invoices: 0 }
    }
    for (const i of invAgg) {
      const key = String(i._id)
      perf[key] = perf[key] || { doctor: i._id, appointments: 0, revenue: 0, invoices: 0 }
      perf[key].revenue = i.revenue
      perf[key].invoices = i.invoices
    }
    const result = Object.values(perf)
    return res.json({ doctorPerformance: result })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute doctor performance' })
  }
}

exports.inventoryUsageAndExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = parseRange(req)
    const items = await InventoryItem.find({}, { name: 1, usageHistory: 1 }).lean()
    const usage = []
    for (const it of items) {
      const qty = (it.usageHistory || []).filter(u => u.date >= startDate && u.date <= endDate).reduce((s, u) => s + (u.quantity || 0), 0)
      usage.push({ item: it.name, quantityUsed: qty })
    }
    const expensesAgg = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ])
    return res.json({ inventoryUsage: usage, expensesByCategory: expensesAgg })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute inventory usage and expenses' })
  }
}

exports.noShowAndCancellationRates = async (req, res) => {
  try {
    const { startDate, endDate } = parseRange(req)
    const appts = await Appointment.find({ date: { $gte: startDate, $lte: endDate } }, { status: 1 }).lean()
    const total = appts.length
    const cancelled = appts.filter(a => a.status === 'cancelled').length
    const rescheduled = appts.filter(a => a.status === 'rescheduled').length
    const rate = total ? Math.round(((cancelled + rescheduled) / total) * 100) : 0
    return res.json({ total, cancelled, rescheduled, rate })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to compute no-show/cancellation rates' })
  }
}