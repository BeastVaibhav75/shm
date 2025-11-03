const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { 
  sendAppointmentConfirmation, 
  sendAppointmentCancellation 
} = require('../utils/whatsapp');

// Get all appointments with filtering and pagination
const getAllAppointments = async (req, res) => {
  try {
    const { 
      patient, 
      doctor, 
      status, 
      date, 
      page = 1, 
      limit = 10, 
      sortBy = 'date', 
      sortOrder = 'asc' 
    } = req.query;
    
    const filter = {};
    
    // Apply filters
    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }
    
    // Role-based filtering
    if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name contact age gender')
      .populate('doctor', 'name specialization')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

// Get appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name contact age gender issue')
      .populate('doctor', 'name specialization phone')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Failed to fetch appointment' });
  }
};

// Create new appointment
const createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { 
      patient, 
      doctor, 
      date, 
      time, 
      notes, 
      duration, 
      type 
    } = req.body;

    // Verify patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(400).json({ message: 'Patient not found' });
    }

    // Verify doctor exists
    const doctorExists = await User.findById(doctor);
    if (!doctorExists || doctorExists.role !== 'doctor') {
      return res.status(400).json({ message: 'Invalid doctor assignment' });
    }

    // Check for conflicting appointments
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      doctor,
      date: {
        $gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate()),
        $lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1)
      },
      time,
      status: { $in: ['confirmed', 'rescheduled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        message: 'Doctor already has an appointment at this time' 
      });
    }

    const appointment = new Appointment({
      patient,
      doctor,
      date: appointmentDate,
      time,
      notes,
      duration: duration || 30,
      type: type || 'consultation',
      createdBy: req.user._id
    });

    await appointment.save();
    
    // Populate the created appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization');

    // Send WhatsApp notification
    try {
      await sendAppointmentConfirmation(populatedAppointment, patientExists, doctorExists);
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
      // Don't fail the request if WhatsApp fails
    }

    res.status(201).json({ 
      message: 'Appointment created successfully', 
      appointment: populatedAppointment 
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { 
      patient, 
      doctor, 
      date, 
      time, 
      notes, 
      status, 
      duration, 
      type 
    } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check for conflicting appointments (excluding current appointment)
    if (doctor && date && time) {
      const appointmentDate = new Date(date);
      const existingAppointment = await Appointment.findOne({
        _id: { $ne: req.params.id },
        doctor,
        date: {
          $gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate()),
          $lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1)
        },
        time,
        status: { $in: ['confirmed', 'rescheduled'] }
      });

      if (existingAppointment) {
        return res.status(400).json({ 
          message: 'Doctor already has an appointment at this time' 
        });
      }
    }

    const updateData = {
      patient,
      doctor,
      date: date ? new Date(date) : appointment.date,
      time,
      notes,
      status,
      duration,
      type,
      updatedBy: req.user._id
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patient', 'name contact')
     .populate('doctor', 'name specialization');

    // Send WhatsApp notification for status changes
    if (status === 'cancelled') {
      try {
        const patient = await Patient.findById(updatedAppointment.patient._id);
        const doctor = await User.findById(updatedAppointment.doctor._id);
        await sendAppointmentCancellation(updatedAppointment, patient, doctor);
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError);
      }
    }

    res.json({ 
      message: 'Appointment updated successfully', 
      appointment: updatedAppointment 
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Failed to delete appointment' });
  }
};

// Get appointment statistics
const getAppointmentStats = async (req, res) => {
  try {
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    const totalAppointments = await Appointment.countDocuments(filter);
    const confirmedAppointments = await Appointment.countDocuments({ ...filter, status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ ...filter, status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ ...filter, status: 'cancelled' });
    
    // Get appointments by status
    const statusStats = await Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get appointments by type
    const typeStats = await Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get today's appointments
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayAppointments = await Appointment.countDocuments({
      ...filter,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    res.json({
      totalAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      todayAppointments,
      statusStats,
      typeStats
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({ message: 'Failed to fetch appointment statistics' });
  }
};

// Get doctor's schedule for a specific date
const getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    const endOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['confirmed', 'rescheduled'] }
    })
    .populate('patient', 'name contact')
    .sort({ time: 1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Get doctor schedule error:', error);
    res.status(500).json({ message: 'Failed to fetch doctor schedule' });
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats,
  getDoctorSchedule
};
