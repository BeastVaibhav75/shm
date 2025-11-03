const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  getDoctors 
} = require('../controllers/userController');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'doctor', 'receptionist']).withMessage('Invalid role'),
  body('phone').isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('specialization').optional().trim().isLength({ min: 2 }).withMessage('Specialization must be at least 2 characters')
];

const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'doctor', 'receptionist']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('specialization').optional().trim().isLength({ min: 2 }).withMessage('Specialization must be at least 2 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', authorize('admin'), getAllUsers);
router.get('/doctors', getDoctors);
router.get('/:id', authorize('admin'), getUserById);
router.post('/', authorize('admin'), createUserValidation, createUser);
router.put('/:id', authorize('admin'), updateUserValidation, updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
