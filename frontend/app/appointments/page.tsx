'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Appointment {
  _id: string
  patient: {
    _id: string
    name: string
    contact: string
    age: number
    gender: string
  }
  doctor: {
    _id: string
    name: string
    specialization: string
  }
  date: string
  time: string
  notes: string
  status: string
  type: string
  duration: number
  createdAt: string
}

// Minimal patient type used for selection in appointment modal
interface Patient {
  _id: string
  name: string
  contact: string
  age?: number
  gender?: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [doctors, setDoctors] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [newAppointment, setNewAppointment] = useState({
    patient: '',
    doctor: '',
    date: '',
    time: '',
    type: 'consultation',
    duration: 30,
    notes: ''
  })
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    if (showAddModal) {
      fetchPatientsList()
    }
  }, [showAddModal])

  useEffect(() => {
    fetchAppointments()
    fetchDoctors()
  }, [currentPage, searchTerm, selectedDoctor, selectedStatus, selectedDate, sortOrder])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy: 'date',
        sortOrder: sortOrder
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedDoctor) params.append('doctor', selectedDoctor)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedDate) params.append('date', selectedDate)

      const response = await api.get(`/appointments?${params}`)
      setAppointments(response.data.appointments)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      toast.error('Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/users/doctors')
      setDoctors(response.data.doctors)
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
    }
  }

  const fetchPatientsList = async () => {
    try {
      const res = await api.get('/patients')
      // patients endpoint may return an array or { patients: [] } depending on implementation in pages
      const data = Array.isArray(res.data) ? res.data : (res.data.patients || [])
      setPatients(data)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}`, { status: newStatus })
      toast.success('Appointment status updated')
      fetchAppointments()
    } catch (error) {
      console.error('Failed to update appointment:', error)
      toast.error('Failed to update appointment')
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return

    try {
      await api.delete(`/appointments/${appointmentId}`)
      toast.success('Appointment deleted successfully')
      fetchAppointments()
    } catch (error) {
      console.error('Failed to delete appointment:', error)
      toast.error('Failed to delete appointment')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-primary-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-error-600" />
      case 'rescheduled':
        return <AlertCircle className="h-4 w-4 text-warning-600" />
      default:
        return <Clock className="h-4 w-4 text-secondary-600" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consultation':
        return <User className="h-4 w-4" />
      case 'treatment':
        return <Stethoscope className="h-4 w-4" />
      case 'follow-up':
        return <Calendar className="h-4 w-4" />
      case 'emergency':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Appointments</h1>
            <p className="text-secondary-600 mt-2">
              Manage patient appointments and schedules
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn btn-outline btn-sm"
            >
              Sort by Date {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          <div className="card-content pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div className="sm:col-span-1">
                <select
                  value={selectedDoctor}
                  onChange={(e) => {
                    setSelectedDoctor(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="input"
                >
                  <option value="">All Doctors</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-1">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="input"
                >
                  <option value="">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="input"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appointments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
        >
          <div className="card-content p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="loading-spinner h-8 w-8"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-row">
                      <th className="table-head">Patient</th>
                      <th className="table-head">Doctor</th>
                      <th className="table-head">Date & Time</th>
                      <th className="table-head">Type</th>
                      <th className="table-head">Status</th>
                      <th className="table-head">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {appointments.map((appointment) => (
                      <tr key={appointment._id} className="table-row">
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-secondary-900">
                              {appointment.patient.name}
                            </p>
                            <p className="text-sm text-secondary-500">
                              {appointment.patient.age} years, {appointment.patient.gender}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="text-sm font-medium text-secondary-900">
                              Dr. {appointment.doctor.name}
                            </p>
                            <p className="text-xs text-secondary-500">
                              {appointment.doctor.specialization}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="text-sm font-medium text-secondary-900">
                              {formatDate(appointment.date)}
                            </p>
                            <p className="text-xs text-secondary-500">
                              {formatTime(appointment.time)}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(appointment.type)}
                            <span className="text-sm capitalize">
                              {appointment.type}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(appointment.status)}
                            <span className={`badge ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <select
                              value={appointment.status}
                              onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                              className="text-xs border border-secondary-300 rounded px-2 py-1"
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="rescheduled">Rescheduled</option>
                            </select>
                            <button
                              onClick={() => handleDeleteAppointment(appointment._id)}
                              className="p-1 hover:bg-error-100 rounded"
                            >
                              <XCircle className="h-4 w-4 text-error-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer">
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Book Appointment Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Book Appointment
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Patient</label>
                    <select
                      value={newAppointment.patient}
                      onChange={(e) => setNewAppointment({ ...newAppointment, patient: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Select patient</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.contact})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Doctor</label>
                    <select
                      value={newAppointment.doctor || selectedDoctor}
                      onChange={(e) => setNewAppointment({ ...newAppointment, doctor: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Date</label>
                      <input
                        type="date"
                        value={newAppointment.date}
                        onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="label">Time</label>
                      <input
                        type="time"
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Type</label>
                      <select
                        value={newAppointment.type}
                        onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                        className="input w-full"
                      >
                        <option value="consultation">Consultation</option>
                        <option value="treatment">Treatment</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Duration (minutes)</label>
                      <input
                        type="number"
                        value={newAppointment.duration}
                        onChange={(e) => setNewAppointment({ ...newAppointment, duration: Number(e.target.value) })}
                        className="input w-full"
                        min={15}
                        max={240}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Notes</label>
                    <textarea
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                      className="input w-full min-h-[80px] resize-none"
                      placeholder="Any notes for this appointment"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewAppointment({
                        patient: '',
                        doctor: '',
                        date: '',
                        time: '',
                        type: 'consultation',
                        duration: 30,
                        notes: ''
                      })
                    }}
                    className="btn btn-outline btn-md flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const payload: any = {
                          patient: newAppointment.patient,
                          doctor: newAppointment.doctor || selectedDoctor,
                          date: newAppointment.date,
                          time: newAppointment.time,
                          type: newAppointment.type,
                          duration: Number(newAppointment.duration),
                          notes: newAppointment.notes,
                        }

                        await api.post('/appointments', payload)
                        toast.success('Appointment booked successfully')
                        setShowAddModal(false)
                        setNewAppointment({
                          patient: '',
                          doctor: '',
                          date: '',
                          time: '',
                          type: 'consultation',
                          duration: 30,
                          notes: ''
                        })
                        fetchAppointments()
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Failed to book appointment')
                      }
                    }}
                    className="btn btn-primary btn-md flex-1"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
