/**
 * WhatsApp Notification Utility
 * Placeholder functions for sending WhatsApp messages
 * In production, integrate with WhatsApp Business API or Twilio
 */

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // Remove any non-digit characters from phone number
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    const formattedNumber = cleanPhoneNumber.startsWith('91') 
      ? cleanPhoneNumber 
      : `91${cleanPhoneNumber}`;

    console.log('📱 WhatsApp Notification:');
    console.log(`To: +${formattedNumber}`);
    console.log(`Message: ${message}`);
    console.log('---');

    // TODO: Integrate with actual WhatsApp API
    // Example with Twilio WhatsApp API:
    // const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({
    //   from: 'whatsapp:+14155238886',
    //   to: `whatsapp:+${formattedNumber}`,
    //   body: message
    // });

    return { success: true, message: 'WhatsApp notification sent (simulated)' };
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return { success: false, error: error.message };
  }
};

// Send patient registration notification
const sendPatientRegistrationNotification = async (patient, doctor) => {
  const message = `Hello ${patient.name}! Welcome to Shuchi Dental Hospital. You have been registered with Dr. ${doctor.name}. Your patient ID is ${patient._id}. For any queries, contact us at +91-XXXXXXXXXX.`;
  
  return await sendWhatsAppMessage(patient.contact, message);
};

// Send appointment confirmation notification
const sendAppointmentConfirmation = async (appointment, patient, doctor) => {
  const appointmentDate = new Date(appointment.date).toLocaleDateString('en-IN');
  const message = `Hello ${patient.name}! Your appointment with Dr. ${doctor.name} is confirmed for ${appointmentDate} at ${appointment.time}. Please arrive 15 minutes early. For any changes, contact us at +91-XXXXXXXXXX.`;
  
  return await sendWhatsAppMessage(patient.contact, message);
};

// Send appointment reminder notification
const sendAppointmentReminder = async (appointment, patient, doctor) => {
  const appointmentDate = new Date(appointment.date).toLocaleDateString('en-IN');
  const message = `Reminder: Hello ${patient.name}! You have an appointment with Dr. ${doctor.name} tomorrow (${appointmentDate}) at ${appointment.time}. Please confirm your attendance by replying to this message.`;
  
  return await sendWhatsAppMessage(patient.contact, message);
};

// Send treatment completion notification
const sendTreatmentCompletionNotification = async (patient, treatment, doctor) => {
  const message = `Hello ${patient.name}! Your ${treatment.type} treatment has been completed by Dr. ${doctor.name}. Please follow the post-treatment care instructions. For any concerns, contact us at +91-XXXXXXXXXX.`;
  
  return await sendWhatsAppMessage(patient.contact, message);
};

// Send appointment cancellation notification
const sendAppointmentCancellation = async (appointment, patient, doctor) => {
  const appointmentDate = new Date(appointment.date).toLocaleDateString('en-IN');
  const message = `Hello ${patient.name}! Your appointment with Dr. ${doctor.name} scheduled for ${appointmentDate} at ${appointment.time} has been cancelled. Please contact us to reschedule at +91-XXXXXXXXXX.`;
  
  return await sendWhatsAppMessage(patient.contact, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendPatientRegistrationNotification,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendTreatmentCompletionNotification,
  sendAppointmentCancellation
};
