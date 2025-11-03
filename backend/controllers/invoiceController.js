const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');

exports.getAllInvoices = async (req, res) => {
  try {
    const { status, patientId, from, to } = req.query;
    const query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (from || to) {
      query.issuedAt = {};
      if (from) query.issuedAt.$gte = new Date(from);
      if (to) query.issuedAt.$lte = new Date(to);
    }
    const invoices = await Invoice.find(query)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .sort({ issuedAt: -1 });
    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patient', 'name contact')
      .populate('doctor', 'name');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Failed to fetch invoice' });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { patient, items = [], gstPercent = 0, discountPercent = 0, dueDate, notes } = req.body;
    const patientExists = await Patient.findById(patient);
    if (!patientExists) return res.status(404).json({ message: 'Patient not found' });

    const invoice = new Invoice({
      patient,
      doctor: req.user._id,
      items,
      gstPercent,
      discountPercent,
      dueDate,
      notes
    });
    await invoice.save();
    res.status(201).json({ invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Failed to create invoice' });
  }
};

exports.createInvoiceForTreatment = async (req, res) => {
  try {
    const { patientId, treatmentRecordId, description, cost, gstPercent = 0, discountPercent = 0 } = req.body;
    const patientExists = await Patient.findById(patientId);
    if (!patientExists) return res.status(404).json({ message: 'Patient not found' });

    const items = [{ description: description || 'Dental Treatment', quantity: 1, unitPrice: cost || 0 }];
    const invoice = new Invoice({
      patient: patientId,
      doctor: req.user._id,
      treatmentRecordId,
      items,
      gstPercent,
      discountPercent
    });
    await invoice.save();
    res.status(201).json({ invoice });
  } catch (error) {
    console.error('Create invoice for treatment error:', error);
    res.status(500).json({ message: 'Failed to create invoice' });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, gstPercent, discountPercent, notes, dueDate } = req.body;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (items) invoice.items = items;
    if (gstPercent !== undefined) invoice.gstPercent = gstPercent;
    if (discountPercent !== undefined) invoice.discountPercent = discountPercent;
    if (notes !== undefined) invoice.notes = notes;
    if (dueDate !== undefined) invoice.dueDate = dueDate;
    await invoice.save();
    res.json({ invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Failed to update invoice' });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method = 'cash', note } = req.body;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    invoice.payments.push({ amount, method, note });
    await invoice.save();
    res.json({ invoice });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ message: 'Failed to add payment' });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Failed to delete invoice' });
  }
};

exports.getIncomeSummary = async (req, res) => {
  try {
    const { period = 'daily', from, to } = req.query;
    const match = {};
    if (from || to) {
      match.issuedAt = {};
      if (from) match.issuedAt.$gte = new Date(from);
      if (to) match.issuedAt.$lte = new Date(to);
    }
    const groupId = period === 'monthly' ? { year: { $year: '$issuedAt' }, month: { $month: '$issuedAt' } } : { year: { $year: '$issuedAt' }, day: { $dayOfYear: '$issuedAt' } };
    const summary = await Invoice.aggregate([
      { $match: match },
      { $group: { _id: groupId, totalIncome: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    res.json({ summary });
  } catch (error) {
    console.error('Income summary error:', error);
    res.status(500).json({ message: 'Failed to fetch income summary' });
  }
};