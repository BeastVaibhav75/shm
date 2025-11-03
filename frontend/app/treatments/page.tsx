'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { 
  Plus, 
  Search, 
  Stethoscope,
  Calendar,
  User,
  DollarSign,
  FileText
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Treatment {
  _id: string
  type: string
  notes: string
  date: string
  cost: number
  addedBy: {
    _id: string
    name: string
  }
}

interface Patient {
  _id: string
  name: string
  contact: string
  age: number
  gender: string
  issue: string
  assignedDoctor: {
    _id: string
    name: string
    specialization: string
  }
  treatmentHistory: Treatment[]
}

export default function TreatmentsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTreatment, setNewTreatment] = useState({
    type: '',
    notes: '',
    cost: 0
  })

  useEffect(() => {
    fetchPatients()
  }, [searchTerm])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50'
      })
      
      if (searchTerm) params.append('search', searchTerm)

      const response = await api.get(`/patients?${params}`)
      setPatients(response.data.patients)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
      toast.error('Failed to fetch patients')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTreatment = async (patientId: string) => {
    if (!newTreatment.type || !newTreatment.notes) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await api.post(`/patients/${patientId}/treatments`, newTreatment)
      toast.success('Treatment record added successfully')
      setNewTreatment({ type: '', notes: '', cost: 0 })
      setShowAddModal(false)
      fetchPatients()
    } catch (error) {
      console.error('Failed to add treatment:', error)
      toast.error('Failed to add treatment record')
    }
  }

  const treatmentTypes = [
    'Root Canal',
    'Cleaning',
    'Filling',
    'Extraction',
    'Crown',
    'Bridge',
    'Dentures',
    'Orthodontics',
    'Gum Treatment',
    'Consultation',
    'Other'
  ]

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
            <h1 className="text-3xl font-bold text-secondary-900">Treatments</h1>
            <p className="text-secondary-600 mt-2">
              Manage patient treatment records
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          <div className="card-content">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </motion.div>

        {/* Patients List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {loading ? (
            <div className="col-span-2 flex items-center justify-center h-64">
              <div className="loading-spinner h-8 w-8"></div>
            </div>
          ) : (
            patients.map((patient) => (
              <div key={patient._id} className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="card-title text-lg">{patient.name}</h3>
                      <p className="card-description">
                        {patient.age} years, {patient.gender}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient)
                        setShowAddModal(true)
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Treatment
                    </button>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-secondary-600">
                      <User className="h-4 w-4" />
                      <span>Dr. {patient.assignedDoctor.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-secondary-600">
                      <Stethoscope className="h-4 w-4" />
                      <span>{patient.issue}</span>
                    </div>
                    
                    {patient.treatmentHistory.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-secondary-900 mb-2">
                          Treatment History ({patient.treatmentHistory.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {patient.treatmentHistory.map((treatment, index) => (
                            <div
                              key={index}
                              className="p-3 bg-secondary-50 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-secondary-900">
                                  {treatment.type}
                                </span>
                                <span className="text-xs text-secondary-500">
                                  {formatDate(treatment.date)}
                                </span>
                              </div>
                              <p className="text-xs text-secondary-600 mb-1">
                                {treatment.notes}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-secondary-500">
                                  Added by: {treatment.addedBy.name}
                                </span>
                                {treatment.cost > 0 && (
                                  <span className="text-xs font-medium text-success-600">
                                    ₹{treatment.cost}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Add Treatment Modal */}
        {showAddModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Add Treatment Record
                </h3>
                <p className="text-sm text-secondary-600 mb-4">
                  Patient: {selectedPatient.name}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">Treatment Type</label>
                    <select
                      value={newTreatment.type}
                      onChange={(e) => setNewTreatment({ ...newTreatment, type: e.target.value })}
                      className="input"
                    >
                      <option value="">Select treatment type</option>
                      {treatmentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      value={newTreatment.notes}
                      onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })}
                      className="input min-h-[100px] resize-none"
                      placeholder="Enter treatment notes..."
                    />
                  </div>
                  
                  <div>
                    <label className="label">Cost (₹)</label>
                    <input
                      type="number"
                      value={newTreatment.cost}
                      onChange={(e) => setNewTreatment({ ...newTreatment, cost: Number(e.target.value) })}
                      className="input"
                      placeholder="Enter treatment cost"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setSelectedPatient(null)
                      setNewTreatment({ type: '', notes: '', cost: 0 })
                    }}
                    className="btn btn-outline btn-md flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddTreatment(selectedPatient._id)}
                    className="btn btn-primary btn-md flex-1"
                  >
                    Add Treatment
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
