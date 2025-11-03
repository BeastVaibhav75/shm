const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  getPatientDentalChart, 
  updateToothInfo, 
  addToothTreatment, 
  addToothImage,
  updateNotationSystem
} = require('../controllers/dentalChartController');

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/patient/:patientId', getPatientDentalChart);
router.put('/patient/:patientId/tooth/:toothNumber', updateToothInfo);
router.post('/patient/:patientId/tooth/:toothNumber/treatment', addToothTreatment);
router.post('/patient/:patientId/tooth/:toothNumber/image', addToothImage);
router.put('/patient/:patientId/notation', updateNotationSystem);

module.exports = router;