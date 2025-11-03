// Simple env check script
require('dotenv').config();

const report = (key, value) => {
  const status = value ? 'SET' : 'MISSING';
  console.log(`${key}: ${status}`);
};

report('JWT_SECRET', process.env.JWT_SECRET);
report('PORT', process.env.PORT);
report('MONGODB_URI', process.env.MONGODB_URI);



