const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  getAllTreatmentPlans, 
  getTreatmentPlanById, 
  createTreatmentPlan, 
  updateTreatmentPlan,
  updateStepStatus,
  deleteTreatmentPlan
} = require('../controllers/treatmentPlanController');

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', getAllTreatmentPlans);
router.get('/:id', getTreatmentPlanById);
router.post('/', createTreatmentPlan);
router.put('/:id', updateTreatmentPlan);
router.put('/:planId/step/:stepId', updateStepStatus);
router.delete('/:id', deleteTreatmentPlan);

module.exports = router;