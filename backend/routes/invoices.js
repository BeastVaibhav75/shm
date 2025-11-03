const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

// All routes require authentication
router.use(authenticateToken);

// CRUD
router.get('/', authorize('admin', 'doctor', 'receptionist'), invoiceController.getAllInvoices);
router.get('/:id', authorize('admin', 'doctor', 'receptionist'), invoiceController.getInvoiceById);
router.post('/', authorize('admin', 'doctor'), invoiceController.createInvoice);
router.put('/:id', authorize('admin', 'doctor'), invoiceController.updateInvoice);
router.delete('/:id', authorize('admin'), invoiceController.deleteInvoice);

// Payments
router.post('/:id/payments', authorize('admin', 'doctor', 'receptionist'), invoiceController.addPayment);

// Create invoice linked to treatment
router.post('/create-for-treatment', authorize('doctor'), invoiceController.createInvoiceForTreatment);

// Income summary
router.get('/summary/income', authorize('admin', 'doctor'), invoiceController.getIncomeSummary);

module.exports = router;