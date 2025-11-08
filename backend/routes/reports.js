const express = require('express')
const router = express.Router()
const reports = require('../controllers/reportController')

router.get('/monthly-patient-summary', reports.monthlyPatientSummary)
router.get('/treatment-revenue', reports.treatmentWiseRevenue)
router.get('/doctor-performance', reports.doctorWisePerformance)
router.get('/inventory-usage-expenses', reports.inventoryUsageAndExpenses)
router.get('/no-show-cancellation-rates', reports.noShowAndCancellationRates)

module.exports = router