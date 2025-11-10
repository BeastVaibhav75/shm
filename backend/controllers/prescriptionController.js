const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { sendWhatsAppMessage } = require('../utils/whatsapp');

// Get all prescriptions
exports.getAllPrescriptions = async (req, res) => {
  try {
    const { patientId, doctorId, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    
    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Prescription.countDocuments(query);
    
    res.json({
      prescriptions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error getting prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get prescription by ID
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findById(id)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .populate('appointment');
      
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    res.json(prescription);
  } catch (error) {
    console.error('Error getting prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new prescription
exports.createPrescription = async (req, res) => {
  try {
    const { patient, medicines, generalInstructions, diagnosis, followUpDate, appointment, caseId } = req.body;
    
    // Check if patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const prescription = new Prescription({
      patient,
      doctor: req.user._id,
      medicines,
      generalInstructions,
      diagnosis,
      followUpDate,
      appointment,
      caseId: caseId || undefined,
      digitalSignature: req.user.name
    });
    
    await prescription.save();
    
    res.status(201).json(prescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update prescription
exports.updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicines, generalInstructions, diagnosis, followUpDate } = req.body;
    
    const prescription = await Prescription.findById(id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Only allow the doctor who created it to update
    if (prescription.doctor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this prescription' });
    }
    
    prescription.medicines = medicines || prescription.medicines;
    prescription.generalInstructions = generalInstructions || prescription.generalInstructions;
    prescription.diagnosis = diagnosis || prescription.diagnosis;
    prescription.followUpDate = followUpDate || prescription.followUpDate;
    
    await prescription.save();
    
    res.json(prescription);
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send prescription via WhatsApp
exports.sendPrescriptionWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findById(id)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization');
      
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Format prescription for WhatsApp
    const message = formatPrescriptionForWhatsApp(prescription);
    
    // Send WhatsApp message
    const sent = await sendWhatsAppMessage(prescription.patient.contact, message);
    
    if (sent) {
      // Update sent status
      if (!prescription.sentVia.includes('whatsapp')) {
        prescription.sentVia.push('whatsapp');
        await prescription.save();
      }
      
      res.json({ success: true, message: 'Prescription sent via WhatsApp' });
    } else {
      res.status(500).json({ message: 'Failed to send WhatsApp message' });
    }
  } catch (error) {
    console.error('Error sending prescription via WhatsApp:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to format prescription for WhatsApp
function formatPrescriptionForWhatsApp(prescription) {
  let message = `*PRESCRIPTION FROM SHUCHI DENTAL HOSPITAL*\n\n`;
  message += `*Patient:* ${prescription.patient.name}\n`;
  message += `*Doctor:* Dr. ${prescription.doctor.name}\n`;
  message += `*Date:* ${new Date(prescription.createdAt).toLocaleDateString()}\n\n`;
  
  if (prescription.diagnosis) {
    message += `*Diagnosis:* ${prescription.diagnosis}\n\n`;
  }
  
  message += `*MEDICINES*\n`;
  prescription.medicines.forEach((med, index) => {
    message += `${index + 1}. ${med.name} - ${med.dosage}\n`;
    message += `   ${med.frequency} for ${med.duration}\n`;
    if (med.instructions) {
      message += `   Instructions: ${med.instructions}\n`;
    }
    message += '\n';
  });
  
  if (prescription.generalInstructions) {
    message += `*General Instructions:*\n${prescription.generalInstructions}\n\n`;
  }
  
  if (prescription.followUpDate) {
    message += `*Follow-up Date:* ${new Date(prescription.followUpDate).toLocaleDateString()}\n\n`;
  }
  
  message += `*Digital Signature:* ${prescription.digitalSignature}\n`;
  message += `Shuchi Dental Hospital`;
  
  return message;
}

// Generate PDF prescription
exports.generatePrescriptionPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findById(id)
      .populate('patient', 'name contact age gender')
      .populate('doctor', 'name specialization');
      
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // PDF generation logic would go here
    // For now, we'll just return the prescription data
    
    // Update sent status
    if (!prescription.sentVia.includes('print')) {
      prescription.sentVia.push('print');
      await prescription.save();
    }
    
    res.json({
      success: true,
      message: 'PDF generation endpoint (to be implemented with actual PDF library)',
      data: prescription
    });
  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    res.status(500).json({ message: 'Server error' });
  }
};