const express = require('express')
const router = express.Router()
const reports = require('../controllers/reportController')
const { authenticateToken, authorize } = require('../middleware/auth')

router.use(authenticateToken)

router.get('/monthly-patient-summary', authorize('admin', 'doctor', 'receptionist'), reports.monthlyPatientSummary)
router.get('/treatment-revenue', authorize('admin', 'doctor'), reports.treatmentWiseRevenue)
router.get('/doctor-performance', authorize('admin', 'doctor'), reports.doctorWisePerformance)
router.get('/inventory-usage-expenses', authorize('admin'), reports.inventoryUsageAndExpenses)
router.get('/no-show-cancellation-rates', authorize('admin', 'doctor', 'receptionist'), reports.noShowAndCancellationRates)

module.exports = router