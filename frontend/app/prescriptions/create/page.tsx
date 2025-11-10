'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Plus, Trash2, Send, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreatePrescriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetPatientId = searchParams.get('patientId') || ''
  const presetCaseId = searchParams.get('caseId') || ''
  const presetAppointmentId = searchParams.get('appointmentId') || ''
  const [patients, setPatients] = useState<any[]>([])
  const [medicines, setMedicines] = useState<any[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    patientId: presetPatientId,
    diagnosis: '',
    instructions: '',
    followUpDate: '',
    sendVia: 'whatsapp'
  })
  const [lockedPatient, setLockedPatient] = useState(Boolean(presetPatientId))

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients')
        let data = Array.isArray(res.data) ? res.data : res.data?.patients || []

        if (presetPatientId && !data.some((patient: any) => patient._id === presetPatientId)) {
          try {
            const patientRes = await api.get(`/patients/${presetPatientId}`)
            const patient = patientRes.data?.patient || patientRes.data
            if (patient) {
              data = [...data, patient]
            }
          } catch (patientError) {
            console.warn('Failed to fetch preset patient details:', patientError)
          }
        }

        setPatients(data)
      } catch (error) {
        console.error('Error fetching patients:', error)
        toast.error('Failed to load patients')
      }
    }

    fetchPatients()
  }, [presetPatientId])

  useEffect(() => {
    if (presetPatientId) {
      setFormData((prev) => ({ ...prev, patientId: presetPatientId }))
      setLockedPatient(true)
    }
  }, [presetPatientId])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleMedicineChange = (index: number, field: string, value: string) => {
    const updatedMedicines = [...medicines]
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value }
    setMedicines(updatedMedicines)
  }

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  const removeMedicine = (index: number) => {
    if (medicines.length === 1) return
    const updatedMedicines = medicines.filter((_, i) => i !== index)
    setMedicines(updatedMedicines)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.patientId) {
      toast.error('Please select a patient')
      return
    }
    
    if (medicines.some(m => !m.name || !m.dosage || !m.frequency || !m.duration)) {
      toast.error('Please fill all medicine fields: name, dosage, frequency, duration')
      return
    }
    
    setLoading(true)
    
    try {
      const prescriptionData = {
        patient: formData.patientId,
        diagnosis: formData.diagnosis,
        medicines: medicines,
        generalInstructions: formData.instructions,
        followUpDate: formData.followUpDate || undefined,
        sendVia: formData.sendVia,
        caseId: presetCaseId || undefined,
        appointment: presetAppointmentId || undefined
      }
      
      const res = await api.post('/prescriptions', prescriptionData)
      toast.success('Prescription created successfully')
      
      // Generate PDF
      await api.get(`/prescriptions/${res.data._id}/generate-pdf`)
      
      // Send via selected method if needed
      if (formData.sendVia && formData.sendVia !== 'none') {
        await api.post(`/prescriptions/${res.data._id}/send`, {
          method: formData.sendVia
        })
        toast.success(`Prescription sent via ${formData.sendVia}`)
      }
      
      router.push('/prescriptions')
    } catch (error) {
      console.error('Error creating prescription:', error)
      toast.error('Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Prescription</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
                disabled={lockedPatient}
                required
              >
                <option value="">Select Patient</option>
                {Array.isArray(patients) ? patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name}
                  </option>
                )) : null}
              </select>
              {lockedPatient && (
                <p className="text-xs text-secondary-500 mt-1">
                  Patient pre-selected from appointment. Go back if you need to choose a different patient.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Diagnosis</label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Primary diagnosis"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Medicines</h2>
              <button
                type="button"
                onClick={addMedicine}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                <Plus size={16} className="mr-1" /> Add Medicine
              </button>
            </div>
            
            {medicines.map((medicine, index) => (
              <div key={index} className="border rounded p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Medicine #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="text-red-500"
                    disabled={medicines.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Medicine Name</label>
                    <input
                      type="text"
                      value={medicine.name}
                      onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Medicine name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Dosage</label>
                    <input
                      type="text"
                      value={medicine.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., 500mg"
                    required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Frequency</label>
                    <input
                      type="text"
                      value={medicine.frequency}
                      onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., Twice daily"
                    required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <input
                      type="text"
                      value={medicine.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., 7 days"
                    required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Instructions</label>
                    <input
                      type="text"
                      value={medicine.instructions}
                      onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., After meals"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">General Instructions</label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleFormChange}
              className="w-full border rounded px-3 py-2 h-24"
              placeholder="Additional instructions for the patient..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Follow-up Date</label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Send Via</label>
              <select
                name="sendVia"
                value={formData.sendVia}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="none">Don't send</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <FileText size={18} className="mr-2" /> Create Prescription
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}