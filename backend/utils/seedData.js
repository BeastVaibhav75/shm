const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruchi_dental_hospital');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [
      {
        name: 'Dr. Rajesh Kumar',
        email: 'dr.rajesh@shuchidental.com',
        password: 'password123',
        role: 'doctor',
        phone: '9876543210',
        specialization: 'Oral and Maxillofacial Surgery'
      },
      {
        name: 'Dr. Priya Sharma',
        email: 'dr.priya@shuchidental.com',
        password: 'password123',
        role: 'doctor',
        phone: '9876543211',
        specialization: 'Orthodontics'
      },
      {
        name: 'Dr. Amit Patel',
        email: 'dr.amit@shuchidental.com',
        password: 'password123',
        role: 'doctor',
        phone: '9876543212',
        specialization: 'Endodontics'
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha@shuchidental.com',
        password: 'password123',
        role: 'receptionist',
        phone: '9876543213'
      },
      {
        name: 'Ravi Singh',
        email: 'ravi@shuchidental.com',
        password: 'password123',
        role: 'receptionist',
        phone: '9876543214'
      },
      {
        name: 'Admin User',
        email: 'admin@shuchidental.com',
        password: 'admin123',
        role: 'admin',
        phone: '9876543215'
      }
    ];

    // Hash passwords before inserting because insertMany skips pre-save hooks
    const salt = await bcrypt.genSalt(10);
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, salt)
      }))
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log('Created users:', createdUsers.length);

    // Get doctors for patient assignment
    const doctors = createdUsers.filter(user => user.role === 'doctor');

    // Create patients
    const patients = [
      {
        name: 'Arjun Mehta',
        contact: '9123456789',
        age: 35,
        gender: 'male',
        issue: 'Severe tooth pain in lower left molar, possible root canal needed',
        assignedDoctor: doctors[0]._id,
        address: '123 MG Road, Mumbai',
        emergencyContact: '9123456788',
        medicalHistory: 'Diabetes Type 2',
        allergies: 'Penicillin'
      },
      {
        name: 'Kavya Reddy',
        contact: '9123456790',
        age: 28,
        gender: 'female',
        issue: 'Misaligned teeth, needs braces treatment',
        assignedDoctor: doctors[1]._id,
        address: '456 Brigade Road, Bangalore',
        emergencyContact: '9123456787',
        medicalHistory: 'None',
        allergies: 'None'
      },
      {
        name: 'Vikram Joshi',
        contact: '9123456791',
        age: 42,
        gender: 'male',
        issue: 'Multiple cavities and gum disease',
        assignedDoctor: doctors[2]._id,
        address: '789 Park Street, Kolkata',
        emergencyContact: '9123456786',
        medicalHistory: 'Hypertension',
        allergies: 'Latex'
      },
      {
        name: 'Priya Agarwal',
        contact: '9123456792',
        age: 25,
        gender: 'female',
        issue: 'Wisdom tooth extraction required',
        assignedDoctor: doctors[0]._id,
        address: '321 Connaught Place, Delhi',
        emergencyContact: '9123456785',
        medicalHistory: 'None',
        allergies: 'None'
      },
      {
        name: 'Rohit Kumar',
        contact: '9123456793',
        age: 50,
        gender: 'male',
        issue: 'Complete denture fitting needed',
        assignedDoctor: doctors[1]._id,
        address: '654 Anna Salai, Chennai',
        emergencyContact: '9123456784',
        medicalHistory: 'Diabetes, Heart condition',
        allergies: 'Metal'
      },
      {
        name: 'Sunita Devi',
        contact: '9123456794',
        age: 38,
        gender: 'female',
        issue: 'Regular cleaning and checkup',
        assignedDoctor: doctors[2]._id,
        address: '987 Marine Drive, Mumbai',
        emergencyContact: '9123456783',
        medicalHistory: 'None',
        allergies: 'None'
      }
    ];

    const createdPatients = await Patient.insertMany(patients);
    console.log('Created patients:', createdPatients.length);

    // Add treatment history to some patients
    const treatmentTypes = [
      'Root Canal',
      'Cleaning',
      'Filling',
      'Extraction',
      'Crown',
      'Consultation'
    ];

    // Add treatments to first few patients
    for (let i = 0; i < 3; i++) {
      const patient = createdPatients[i];
      const doctor = doctors[i % doctors.length];
      
      const treatments = [
        {
          type: 'Consultation',
          notes: 'Initial consultation and examination',
          addedBy: doctor._id,
          cost: 500
        },
        {
          type: treatmentTypes[Math.floor(Math.random() * treatmentTypes.length)],
          notes: 'Treatment performed as per diagnosis',
          addedBy: doctor._id,
          cost: Math.floor(Math.random() * 5000) + 1000
        }
      ];

      patient.treatmentHistory = treatments;
      await patient.save();
    }

    // Create appointments
    const appointments = [
      {
        patient: createdPatients[0]._id,
        doctor: doctors[0]._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '10:00',
        notes: 'Follow-up for root canal treatment',
        status: 'confirmed',
        type: 'treatment',
        createdBy: createdUsers.find(u => u.role === 'receptionist')._id
      },
      {
        patient: createdPatients[1]._id,
        doctor: doctors[1]._id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        time: '14:30',
        notes: 'Braces adjustment appointment',
        status: 'confirmed',
        type: 'treatment',
        createdBy: createdUsers.find(u => u.role === 'receptionist')._id
      },
      {
        patient: createdPatients[2]._id,
        doctor: doctors[2]._id,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        time: '11:15',
        notes: 'Cavity filling and cleaning',
        status: 'confirmed',
        type: 'treatment',
        createdBy: createdUsers.find(u => u.role === 'receptionist')._id
      },
      {
        patient: createdPatients[3]._id,
        doctor: doctors[0]._id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        time: '09:00',
        notes: 'Wisdom tooth extraction surgery',
        status: 'confirmed',
        type: 'treatment',
        createdBy: createdUsers.find(u => u.role === 'receptionist')._id
      },
      {
        patient: createdPatients[4]._id,
        doctor: doctors[1]._id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        time: '15:00',
        notes: 'Denture fitting consultation',
        status: 'completed',
        type: 'consultation',
        createdBy: createdUsers.find(u => u.role === 'receptionist')._id
      }
    ];

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log('Created appointments:', createdAppointments.length);

    console.log('\n=== SEED DATA SUMMARY ===');
    console.log('Users created:', createdUsers.length);
    console.log('Patients created:', createdPatients.length);
    console.log('Appointments created:', createdAppointments.length);
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin: admin@shuchidental.com / admin123');
    console.log('Doctor: dr.rajesh@shuchidental.com / password123');
    console.log('Receptionist: sneha@shuchidental.com / password123');
    console.log('\nSeed data created successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seed data if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
