const DentalChart = require('../models/DentalChart');
const Patient = require('../models/Patient');

// Get dental chart for a patient
exports.getPatientDentalChart = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Find or create dental chart
    let dentalChart = await DentalChart.findOne({ patient: patientId });
    
    if (!dentalChart) {
      // Create a new dental chart with default values
      dentalChart = new DentalChart({
        patient: patientId,
        teeth: [],
        notationSystem: 'fdi',
        updatedBy: req.user._id
      });
      await dentalChart.save();
    }
    
    res.json(dentalChart);
  } catch (error) {
    console.error('Error getting dental chart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update tooth information
exports.updateToothInfo = async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const { condition, notes } = req.body;
    
    // Find dental chart
    let dentalChart = await DentalChart.findOne({ patient: patientId });
    
    if (!dentalChart) {
      return res.status(404).json({ message: 'Dental chart not found' });
    }
    
    // Find tooth index
    const toothIndex = dentalChart.teeth.findIndex(tooth => tooth.number === toothNumber);
    
    if (toothIndex === -1) {
      // Add new tooth
      dentalChart.teeth.push({
        number: toothNumber,
        condition,
        notes,
        treatments: [],
        images: []
      });
    } else {
      // Update existing tooth
      dentalChart.teeth[toothIndex].condition = condition;
      dentalChart.teeth[toothIndex].notes = notes;
    }
    
    dentalChart.lastUpdated = Date.now();
    dentalChart.updatedBy = req.user._id;
    
    await dentalChart.save();
    
    res.json(dentalChart);
  } catch (error) {
    console.error('Error updating tooth info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add treatment to tooth
exports.addToothTreatment = async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const { type, notes } = req.body;
    
    // Find dental chart
    let dentalChart = await DentalChart.findOne({ patient: patientId });
    
    if (!dentalChart) {
      return res.status(404).json({ message: 'Dental chart not found' });
    }
    
    // Find tooth index
    const toothIndex = dentalChart.teeth.findIndex(tooth => tooth.number === toothNumber);
    
    if (toothIndex === -1) {
      return res.status(404).json({ message: 'Tooth not found in chart' });
    }
    
    // Add treatment
    dentalChart.teeth[toothIndex].treatments.push({
      type,
      notes,
      date: Date.now(),
      performedBy: req.user._id
    });
    
    // Update tooth condition based on treatment
    if (type === 'extraction') {
      dentalChart.teeth[toothIndex].condition = 'missing';
    } else if (type === 'root_canal') {
      dentalChart.teeth[toothIndex].condition = 'root_canal';
    } else if (type === 'filling') {
      dentalChart.teeth[toothIndex].condition = 'filled';
    } else if (type === 'crown') {
      dentalChart.teeth[toothIndex].condition = 'crown';
    }
    
    dentalChart.lastUpdated = Date.now();
    dentalChart.updatedBy = req.user._id;
    
    await dentalChart.save();
    
    res.json(dentalChart);
  } catch (error) {
    console.error('Error adding tooth treatment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add image to tooth
exports.addToothImage = async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const { type, url, description } = req.body;
    
    // Find dental chart
    let dentalChart = await DentalChart.findOne({ patient: patientId });
    
    if (!dentalChart) {
      return res.status(404).json({ message: 'Dental chart not found' });
    }
    
    // Find tooth index
    const toothIndex = dentalChart.teeth.findIndex(tooth => tooth.number === toothNumber);
    
    if (toothIndex === -1) {
      return res.status(404).json({ message: 'Tooth not found in chart' });
    }
    
    // Add image
    dentalChart.teeth[toothIndex].images.push({
      type,
      url,
      description,
      date: Date.now()
    });
    
    dentalChart.lastUpdated = Date.now();
    dentalChart.updatedBy = req.user._id;
    
    await dentalChart.save();
    
    res.json(dentalChart);
  } catch (error) {
    console.error('Error adding tooth image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update notation system
exports.updateNotationSystem = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { notationSystem } = req.body;
    
    if (!['fdi', 'universal'].includes(notationSystem)) {
      return res.status(400).json({ message: 'Invalid notation system' });
    }
    
    // Find dental chart
    let dentalChart = await DentalChart.findOne({ patient: patientId });
    
    if (!dentalChart) {
      return res.status(404).json({ message: 'Dental chart not found' });
    }
    
    dentalChart.notationSystem = notationSystem;
    dentalChart.lastUpdated = Date.now();
    dentalChart.updatedBy = req.user._id;
    
    await dentalChart.save();
    
    res.json(dentalChart);
  } catch (error) {
    console.error('Error updating notation system:', error);
    res.status(500).json({ message: 'Server error' });
  }
};