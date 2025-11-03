const InventoryItem = require('../models/InventoryItem');
const Vendor = require('../models/Vendor');

// Inventory items CRUD
exports.getItems = async (req, res) => {
  try {
    const { lowStock } = req.query;
    const query = {};
    let items = await InventoryItem.find(query).populate('vendor', 'name phone');
    if (lowStock) {
      items = items.filter(it => it.quantity <= (it.reorderLevel || 0));
    }
    res.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json({ item });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Failed to create item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    Object.assign(item, req.body);
    await item.save();
    res.json({ item });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Failed to update item' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await InventoryItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
};

// Deduct stock when used in treatment
exports.deductStock = async (req, res) => {
  try {
    const { usedItems = [], patientId, treatmentRecordId } = req.body;
    const lowStock = [];
    for (const ui of usedItems) {
      const item = await InventoryItem.findById(ui.itemId);
      if (!item) continue;
      item.quantity = Math.max(0, (item.quantity || 0) - (ui.quantity || 0));
      item.usageHistory.push({ quantity: ui.quantity || 0, patient: patientId, treatmentRecordId });
      await item.save();
      if (item.quantity <= (item.reorderLevel || 0)) lowStock.push(item);
    }
    res.json({ message: 'Stock updated', lowStock });
  } catch (error) {
    console.error('Deduct stock error:', error);
    res.status(500).json({ message: 'Failed to deduct stock' });
  }
};

// Vendors CRUD
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.json({ vendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ vendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ message: 'Failed to create vendor' });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    Object.assign(vendor, req.body);
    await vendor.save();
    res.json({ vendor });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Failed to update vendor' });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ message: 'Failed to delete vendor' });
  }
};

exports.getLowStockSummary = async (req, res) => {
  try {
    const items = await InventoryItem.find({});
    const low = items.filter(it => it.quantity <= (it.reorderLevel || 0));
    res.json({ count: low.length, items: low });
  } catch (error) {
    console.error('Low stock summary error:', error);
    res.status(500).json({ message: 'Failed to fetch low stock summary' });
  }
};