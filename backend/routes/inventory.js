const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Items
router.get('/items', inventoryController.getItems);
router.post('/items', inventoryController.createItem);
router.put('/items/:id', inventoryController.updateItem);
router.delete('/items/:id', inventoryController.deleteItem);

// Deduct usage
router.post('/items/deduct', inventoryController.deductStock);

// Vendors
router.get('/vendors', inventoryController.getVendors);
router.post('/vendors', inventoryController.createVendor);
router.put('/vendors/:id', inventoryController.updateVendor);
router.delete('/vendors/:id', inventoryController.deleteVendor);

// Low stock summary
router.get('/items/summary/low-stock', inventoryController.getLowStockSummary);

module.exports = router;