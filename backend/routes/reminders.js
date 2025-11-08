const express = require('express')
const router = express.Router()
const reminders = require('../controllers/reminderController')

router.post('/appointments/send-tomorrow', reminders.sendUpcomingAppointmentReminders)
router.post('/treatments/send-feedback', reminders.sendPostTreatmentFeedback)
router.post('/patients/send-birthdays', reminders.sendBirthdayGreetings)
router.get('/logs', reminders.listMessageLogs)

module.exports = router