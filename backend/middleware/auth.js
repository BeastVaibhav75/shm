const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Check if user can access patient data
const canAccessPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const user = req.user;

    // Admin can access all patients
    if (user.role === 'admin') {
      return next();
    }

    // For patient operations, check if user is assigned to the patient
    if (patientId) {
      const Patient = require('../models/Patient');
      const patient = await Patient.findById(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Doctor can only access their assigned patients
      if (user.role === 'doctor' && patient.assignedDoctor.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Access denied to this patient' });
      }

      // Receptionist can access all patients
      if (user.role === 'receptionist') {
        return next();
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error' });
  }
};

// Check if user can access appointment data
const canAccessAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const user = req.user;

    // Admin can access all appointments
    if (user.role === 'admin') {
      return next();
    }

    // For appointment operations, check if user is assigned to the appointment
    if (appointmentId) {
      const Appointment = require('../models/Appointment');
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Doctor can only access appointments assigned to them
      if (user.role === 'doctor' && appointment.doctor.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Access denied to this appointment' });
      }

      // Receptionist can access all appointments
      if (user.role === 'receptionist') {
        return next();
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  canAccessPatient,
  canAccessAppointment
};
