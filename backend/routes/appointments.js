const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorize, canAccessAppointment } = require('../middleware/auth');
const { 
  getAllAppointments, 
  getAppointmentById, 
  createAppointment, 
  updateAppointment, 
  deleteAppointment, 
  getAppointmentStats,
  getDoctorSchedule
} = require('../controllers/appointmentController');

const router = express.Router();

// Validation rules
const createAppointmentValidation = [
  body('patient').isMongoId().withMessage('Valid patient ID is required'),
  body('doctor').isMongoId().withMessage('Valid doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('notes').optional().trim(),
  body('duration').optional().isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes'),
  body('type').optional().isIn(['consultation', 'treatment', 'follow-up', 'emergency']).withMessage('Invalid appointment type')
];

const updateAppointmentValidation = [
  body('patient').optional().isMongoId().withMessage('Valid patient ID is required'),
  body('doctor').optional().isMongoId().withMessage('Valid doctor ID is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('notes').optional().trim(),
  body('status').optional().isIn(['confirmed', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status'),
  body('duration').optional().isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes'),
  body('type').optional().isIn(['consultation', 'treatment', 'follow-up', 'emergency']).withMessage('Invalid appointment type')
];

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/stats', authorize('admin', 'doctor', 'receptionist'), getAppointmentStats);
router.get('/schedule/:doctorId/:date', authorize('admin', 'doctor', 'receptionist'), getDoctorSchedule);
router.get('/', authorize('admin', 'doctor', 'receptionist'), getAllAppointments);
router.get('/:id', authorize('admin', 'doctor', 'receptionist'), canAccessAppointment, getAppointmentById);
router.post('/', authorize('admin', 'doctor', 'receptionist'), createAppointmentValidation, createAppointment);
router.put('/:id', authorize('admin', 'doctor', 'receptionist'), canAccessAppointment, updateAppointmentValidation, updateAppointment);
router.delete('/:id', authorize('admin', 'receptionist'), canAccessAppointment, deleteAppointment);

module.exports = router;
