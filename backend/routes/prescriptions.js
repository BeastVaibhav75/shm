const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  getAllPrescriptions, 
  getPrescriptionById, 
  createPrescription, 
  updatePrescription,
  sendPrescriptionWhatsApp,
  generatePrescriptionPDF
} = require('../controllers/prescriptionController');

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', getAllPrescriptions);
router.get('/:id', getPrescriptionById);
router.post('/', createPrescription);
router.put('/:id', updatePrescription);
router.post('/:id/send-whatsapp', sendPrescriptionWhatsApp);
router.get('/:id/generate-pdf', generatePrescriptionPDF);

module.exports = router;