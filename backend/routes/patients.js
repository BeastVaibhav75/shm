const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorize, canAccessPatient } = require('../middleware/auth');
const { 
  getAllPatients, 
  getPatientById, 
  createPatient, 
  updatePatient, 
  deletePatient, 
  addTreatmentRecord,
  getPatientStats
} = require('../controllers/patientController');

const router = express.Router();

// Validation rules
const createPatientValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('contact').isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('issue').trim().isLength({ min: 5 }).withMessage('Issue description must be at least 5 characters'),
  body('assignedDoctor').optional().isMongoId().withMessage('Valid doctor ID is required'),
  body('address').optional().trim(),
  body('emergencyContact').optional().isMobilePhone('en-IN').withMessage('Valid emergency contact is required'),
  body('medicalHistory').optional().trim(),
  body('allergies').optional().trim()
];

const updatePatientValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('contact').optional().isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('issue').optional().trim().isLength({ min: 5 }).withMessage('Issue description must be at least 5 characters'),
  body('assignedDoctor').optional().isMongoId().withMessage('Valid doctor ID is required'),
  body('address').optional().trim(),
  body('emergencyContact').optional().isMobilePhone('en-IN').withMessage('Valid emergency contact is required'),
  body('medicalHistory').optional().trim(),
  body('allergies').optional().trim()
];

const addTreatmentValidation = [
  body('type').isIn([
    'Root Canal',
    'Cleaning',
    'Filling',
    'Extraction',
    'Crown',
    'Bridge',
    'Dentures',
    'Orthodontics',
    'Gum Treatment',
    'Consultation',
    'Other'
  ]).withMessage('Valid treatment type is required'),
  body('notes').trim().isLength({ min: 5 }).withMessage('Treatment notes must be at least 5 characters'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number')
];

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/stats', authorize('admin', 'doctor', 'receptionist'), getPatientStats);
router.get('/', authorize('admin', 'doctor', 'receptionist'), getAllPatients);
router.get('/:id', authorize('admin', 'doctor', 'receptionist'), canAccessPatient, getPatientById);
router.post('/', authorize('admin', 'doctor', 'receptionist'), createPatientValidation, createPatient);
router.put('/:id', authorize('admin', 'doctor', 'receptionist'), canAccessPatient, updatePatientValidation, updatePatient);
router.delete('/:id', authorize('admin'), canAccessPatient, deletePatient);
router.post('/:id/treatments', authorize('doctor'), canAccessPatient, addTreatmentValidation, addTreatmentRecord);

module.exports = router;
