'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'
import { formatDate, formatPhoneNumber, getGenderColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Patient {
  _id: string
  name: string
  contact: string
  age: number
  gender: string
  issue: string
  assignedDoctor?: {
    _id: string
    name: string
    specialization: string
  } | null
  address: string
  emergencyContact: string
  medicalHistory: string
  allergies: string
  treatmentHistory: any[]
  createdAt: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [doctors, setDoctors] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPatient, setNewPatient] = useState({
    name: '',
    contact: '',
    age: '',
    gender: 'male',
    issue: '',
    assignedDoctor: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: ''
  })

  useEffect(() => {
    fetchPatients()
    fetchDoctors()
  }, [currentPage, searchTerm, selectedDoctor])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedDoctor) params.append('doctor', selectedDoctor)

      const response = await api.get(`/patients?${params}`)
      setPatients(response.data.patients)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
      toast.error('Failed to fetch patients')
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

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return

    try {
      await api.delete(`/patients/${patientId}`)
      toast.success('Patient deleted successfully')
      fetchPatients()
    } catch (error) {
      console.error('Failed to delete patient:', error)
      toast.error('Failed to delete patient')
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
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
            <h1 className="text-3xl font-bold text-secondary-900">Patients</h1>
            <p className="text-secondary-600 mt-2">
              Manage patient records and information
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-md mt-4 sm:mt-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          <div className="card-content pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr),16rem]">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
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
            </div>
          </div>
        </motion.div>

        {/* Patients Table */}
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
                      <th className="table-head">Contact</th>
                      <th className="table-head">Age</th>
                      <th className="table-head">Gender</th>
                      <th className="table-head">Issue</th>
                      <th className="table-head">Doctor</th>
                      <th className="table-head">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {patients.map((patient) => (
                      <tr key={patient._id} className="table-row">
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-secondary-900">
                              {patient.name}
                            </p>
                            <p className="text-sm text-secondary-500">
                              ID: {patient._id.slice(-8)}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-secondary-400" />
                            <span className="text-sm">
                              {formatPhoneNumber(patient.contact)}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm">{patient.age} years</span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${getGenderColor(patient.gender)}`}>
                            {patient.gender}
                          </span>
                        </td>
                        <td className="table-cell">
                          <p className="text-sm text-secondary-900 max-w-xs truncate">
                            {patient.issue}
                          </p>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="text-sm font-medium text-secondary-900">
                              {patient.assignedDoctor ? `Dr. ${patient.assignedDoctor.name}` : 'Unassigned'}
                            </p>
                            {patient.assignedDoctor?.specialization && (
                              <p className="text-xs text-secondary-500">
                                {patient.assignedDoctor.specialization}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Link href={`/patients/${patient._id}`}>
                              <button className="p-1 hover:bg-secondary-100 rounded">
                                <Eye className="h-4 w-4 text-secondary-600" />
                              </button>
                            </Link>
                            <Link href={`/patients/${patient._id}/edit`}>
                              <button className="p-1 hover:bg-secondary-100 rounded">
                                <Edit className="h-4 w-4 text-secondary-600" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeletePatient(patient._id)}
                              className="p-1 hover:bg-error-100 rounded"
                            >
                              <Trash2 className="h-4 w-4 text-error-600" />
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

        {/* Add Patient Modal */}
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
                  Add New Patient
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Full Name</label>
                    <input
                      type="text"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      className="input w-full"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={newPatient.contact}
                      onChange={(e) => setNewPatient({ ...newPatient, contact: e.target.value })}
                      className="input w-full"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Age</label>
                      <input
                        type="number"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                        className="input w-full"
                        placeholder="Age in years"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="label">Gender</label>
                      <select
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                        className="input w-full"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Primary Issue</label>
                    <textarea
                      value={newPatient.issue}
                      onChange={(e) => setNewPatient({ ...newPatient, issue: e.target.value })}
                      className="input w-full min-h-[100px] resize-none"
                      placeholder="Describe the primary issue"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Assign Doctor</label>
                    <select
                      value={newPatient.assignedDoctor || selectedDoctor}
                      onChange={(e) => setNewPatient({ ...newPatient, assignedDoctor: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-secondary-500 mt-1">If you are a doctor, leaving this empty will assign to yourself.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Address</label>
                    <input
                      type="text"
                      value={newPatient.address}
                      onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                      className="input w-full"
                      placeholder="Enter address"
                    />
                  </div>

                  <div>
                    <label className="label">Emergency Contact</label>
                    <input
                      type="tel"
                      value={newPatient.emergencyContact}
                      onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                      className="input w-full"
                      placeholder="Enter emergency contact number"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Medical History</label>
                    <textarea
                      value={newPatient.medicalHistory}
                      onChange={(e) => setNewPatient({ ...newPatient, medicalHistory: e.target.value })}
                      className="input w-full min-h-[80px] resize-none"
                      placeholder="Any relevant medical history"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Allergies</label>
                    <input
                      type="text"
                      value={newPatient.allergies}
                      onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                      className="input w-full"
                      placeholder="Known allergies"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewPatient({
                        name: '',
                        contact: '',
                        age: '',
                        gender: 'male',
                        issue: '',
                        assignedDoctor: '',
                        address: '',
                        emergencyContact: '',
                        medicalHistory: '',
                        allergies: ''
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
                          name: newPatient.name,
                          contact: newPatient.contact,
                          age: Number(newPatient.age),
                          gender: newPatient.gender,
                          issue: newPatient.issue,
                          address: newPatient.address,
                          emergencyContact: newPatient.emergencyContact,
                          medicalHistory: newPatient.medicalHistory,
                          allergies: newPatient.allergies,
                        }
                        const doctorId = newPatient.assignedDoctor || selectedDoctor
                        if (doctorId) payload.assignedDoctor = doctorId

                        await api.post('/patients', payload)
                        toast.success('Patient added successfully')
                        setShowAddModal(false)
                        setNewPatient({
                          name: '',
                          contact: '',
                          age: '',
                          gender: 'male',
                          issue: '',
                          assignedDoctor: '',
                          address: '',
                          emergencyContact: '',
                          medicalHistory: '',
                          allergies: ''
                        })
                        fetchPatients()
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Failed to add patient')
                      }
                    }}
                    className="btn btn-primary btn-md flex-1"
                  >
                    Add Patient
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
