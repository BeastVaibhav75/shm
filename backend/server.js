const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/dental-charts', require('./routes/dentalCharts'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/treatment-plans', require('./routes/treatmentPlans'));
// Mount new financial and inventory routes
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/expenses', require('./routes/expenses'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Shuchi Dental Hospital API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruchi_dental_hospital')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
