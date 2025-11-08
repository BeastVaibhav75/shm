const express = require('express')
const router = express.Router()
const analytics = require('../controllers/analyticsController')

router.get('/appointments/daily', analytics.getDailyAppointments)
router.get('/treatments/common', analytics.getMostCommonTreatments)
router.get('/revenue/monthly', analytics.getMonthlyRevenue)
router.get('/doctor/performance', analytics.getDoctorPerformance)
router.get('/retention-followup', analytics.getRetentionAndFollowUp)
router.get('/payments/outstanding', analytics.getOutstandingPayments)

module.exports = router