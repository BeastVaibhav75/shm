const TreatmentPlan = require('../models/TreatmentPlan');
const Patient = require('../models/Patient');

// Get all treatment plans
exports.getAllTreatmentPlans = async (req, res) => {
  try {
    const { patientId, doctorId, status, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (status) query.status = status;
    
    const treatmentPlans = await TreatmentPlan.find(query)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await TreatmentPlan.countDocuments(query);
    
    res.json({
      treatmentPlans,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error getting treatment plans:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get treatment plan by ID
exports.getTreatmentPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const treatmentPlan = await TreatmentPlan.findById(id)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .populate('steps.appointment');
      
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }
    
    res.json(treatmentPlan);
  } catch (error) {
    console.error('Error getting treatment plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new treatment plan
exports.createTreatmentPlan = async (req, res) => {
  try {
    const { patient, title, description, steps, totalCost, estimatedDuration, startDate } = req.body;
    
    // Check if patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const treatmentPlan = new TreatmentPlan({
      patient,
      title,
      description,
      doctor: req.user._id,
      steps: steps || [],
      totalCost: totalCost || 0,
      estimatedDuration: estimatedDuration || 1,
      startDate: startDate || Date.now(),
      status: 'active',
      progress: 0
    });
    
    await treatmentPlan.save();
    
    res.status(201).json(treatmentPlan);
  } catch (error) {
    console.error('Error creating treatment plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update treatment plan
exports.updateTreatmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, steps, totalCost, estimatedDuration, status } = req.body;
    
    const treatmentPlan = await TreatmentPlan.findById(id);
    
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }
    
    // Only allow the doctor who created it to update
    if (treatmentPlan.doctor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this treatment plan' });
    }
    
    if (title) treatmentPlan.title = title;
    if (description) treatmentPlan.description = description;
    if (steps) treatmentPlan.steps = steps;
    if (totalCost) treatmentPlan.totalCost = totalCost;
    if (estimatedDuration) treatmentPlan.estimatedDuration = estimatedDuration;
    if (status) treatmentPlan.status = status;
    
    // Calculate progress
    if (steps) {
      const completedSteps = steps.filter(step => step.status === 'completed').length;
      treatmentPlan.progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
    }
    
    await treatmentPlan.save();
    
    res.json(treatmentPlan);
  } catch (error) {
    console.error('Error updating treatment plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update treatment step status
exports.updateStepStatus = async (req, res) => {
  try {
    const { planId, stepId } = req.params;
    const { status, notes, completedDate } = req.body;
    
    const treatmentPlan = await TreatmentPlan.findById(planId);
    
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }
    
    // Find step index
    const stepIndex = treatmentPlan.steps.findIndex(step => step._id.toString() === stepId);
    
    if (stepIndex === -1) {
      return res.status(404).json({ message: 'Step not found in treatment plan' });
    }
    
    // Update step
    treatmentPlan.steps[stepIndex].status = status || treatmentPlan.steps[stepIndex].status;
    treatmentPlan.steps[stepIndex].notes = notes || treatmentPlan.steps[stepIndex].notes;
    
    if (status === 'completed') {
      treatmentPlan.steps[stepIndex].completedDate = completedDate || Date.now();
    }
    
    // Recalculate progress
    const completedSteps = treatmentPlan.steps.filter(step => step.status === 'completed').length;
    treatmentPlan.progress = treatmentPlan.steps.length > 0 
      ? Math.round((completedSteps / treatmentPlan.steps.length) * 100) 
      : 0;
    
    // Update plan status if all steps are completed
    if (treatmentPlan.progress === 100) {
      treatmentPlan.status = 'completed';
    }
    
    await treatmentPlan.save();
    
    res.json(treatmentPlan);
  } catch (error) {
    console.error('Error updating step status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete treatment plan
exports.deleteTreatmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const treatmentPlan = await TreatmentPlan.findById(id);
    
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }
    
    // Only allow the doctor who created it or admin to delete
    if (treatmentPlan.doctor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this treatment plan' });
    }
    
    await TreatmentPlan.findByIdAndDelete(id);
    
    res.json({ message: 'Treatment plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting treatment plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};