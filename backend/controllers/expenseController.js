const Expense = require('../models/Expense');

exports.getExpenses = async (req, res) => {
  try {
    const { category, from, to } = req.query;
    const query = {};
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json({ expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Failed to create expense' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    Object.assign(expense, req.body);
    await expense.save();
    res.json({ expense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Failed to update expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const match = {};
    if (year) {
      // filter by year
      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${parseInt(year,10)+1}-01-01T00:00:00Z`);
      match.date = { $gte: start, $lt: end };
    }
    const summary = await Expense.aggregate([
      { $match: match },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, totalExpenses: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ summary });
  } catch (error) {
    console.error('Monthly expense summary error:', error);
    res.status(500).json({ message: 'Failed to fetch expense summary' });
  }
};