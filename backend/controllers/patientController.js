const Patient = require('../models/Patient');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendPatientRegistrationNotification } = require('../utils/whatsapp');

// Get all patients with filtering and pagination
const getAllPatients = async (req, res) => {
  try {
    const { 
      search, 
      doctor, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { issue: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Doctor filter
    if (doctor) {
      filter.assignedDoctor = doctor;
    }
    
    // Role-based filtering
    if (req.user.role === 'doctor') {
      filter.assignedDoctor = req.user._id;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const patients = await Patient.find(filter)
      .populate('assignedDoctor', 'name specialization')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(filter);

    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Failed to fetch patients' });
  }
};

// Get patient by ID
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name specialization phone')
      .populate('treatmentHistory.addedBy', 'name');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Failed to fetch patient' });
  }
};

// Create new patient
const createPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { 
      name, 
      contact, 
      age, 
      gender, 
      issue, 
      assignedDoctor, 
      address, 
      emergencyContact, 
      medicalHistory, 
      allergies 
    } = req.body;

    // If doctor is creating patient and no doctor assigned, assign themselves
    const doctorId = assignedDoctor || (req.user.role === 'doctor' ? req.user._id : null);
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor assignment is required' });
    }

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({ message: 'Invalid doctor assignment' });
    }

    const patient = new Patient({
      name,
      contact,
      age,
      gender,
      issue,
      assignedDoctor: doctorId,
      address,
      emergencyContact,
      medicalHistory,
      allergies
    });

    await patient.save();
    
    // Populate the created patient
    const populatedPatient = await Patient.findById(patient._id)
      .populate('assignedDoctor', 'name specialization');

    // Send WhatsApp notification
    try {
      await sendPatientRegistrationNotification(populatedPatient, doctor);
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
      // Don't fail the request if WhatsApp fails
    }

    res.status(201).json({ 
      message: 'Patient created successfully', 
      patient: populatedPatient 
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Failed to create patient' });
  }
};

// Update patient
const updatePatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { 
      name, 
      contact, 
      age, 
      gender, 
      issue, 
      assignedDoctor, 
      address, 
      emergencyContact, 
      medicalHistory, 
      allergies 
    } = req.body;

    // If doctor assignment is being changed, verify the new doctor
    if (assignedDoctor) {
      const doctor = await User.findById(assignedDoctor);
      if (!doctor || doctor.role !== 'doctor') {
        return res.status(400).json({ message: 'Invalid doctor assignment' });
      }
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        name,
        contact,
        age,
        gender,
        issue,
        assignedDoctor,
        address,
        emergencyContact,
        medicalHistory,
        allergies
      },
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'name specialization');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ 
      message: 'Patient updated successfully', 
      patient 
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Failed to update patient' });
  }
};

// Delete patient
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Failed to delete patient' });
  }
};

// Add treatment record
const addTreatmentRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { type, notes, cost } = req.body;

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const treatmentRecord = {
      type,
      notes,
      cost: cost || 0,
      addedBy: req.user._id
    };

    patient.treatmentHistory.push(treatmentRecord);
    await patient.save();

    // Populate the updated patient
    const updatedPatient = await Patient.findById(patient._id)
      .populate('assignedDoctor', 'name specialization')
      .populate('treatmentHistory.addedBy', 'name');

    res.json({ 
      message: 'Treatment record added successfully', 
      patient: updatedPatient 
    });
  } catch (error) {
    console.error('Add treatment record error:', error);
    res.status(500).json({ message: 'Failed to add treatment record' });
  }
};

// Get patient statistics
const getPatientStats = async (req, res) => {
  try {
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'doctor') {
      filter.assignedDoctor = req.user._id;
    }

    const totalPatients = await Patient.countDocuments(filter);
    const activePatients = await Patient.countDocuments({ ...filter, isActive: true });
    
    // Get patients by gender
    const genderStats = await Patient.aggregate([
      { $match: filter },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Get patients by age groups
    const ageStats = await Patient.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 18] }, then: '0-17' },
                { case: { $lt: ['$age', 30] }, then: '18-29' },
                { case: { $lt: ['$age', 45] }, then: '30-44' },
                { case: { $lt: ['$age', 60] }, then: '45-59' }
              ],
              default: '60+'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalPatients,
      activePatients,
      genderStats,
      ageStats
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({ message: 'Failed to fetch patient statistics' });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  addTreatmentRecord,
  getPatientStats
};
