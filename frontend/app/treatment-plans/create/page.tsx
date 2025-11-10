'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Plus, Trash2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateTreatmentPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetPatientId = searchParams.get('patientId') || ''
  const presetDoctorId = searchParams.get('doctorId') || ''
  const presetCaseId = searchParams.get('caseId') || ''
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [steps, setSteps] = useState<any[]>([
    { title: '', description: '', plannedDate: '', cost: '', teethInvolved: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    patientId: presetPatientId,
    doctorId: presetDoctorId,
    title: '',
    description: '',
    startDate: '',
    estimatedDuration: ''
  })
  const [lockedPatient, setLockedPatient] = useState(Boolean(presetPatientId))
  const [lockedDoctor, setLockedDoctor] = useState(Boolean(presetDoctorId))

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/users?role=doctor')
        ])

        let patientsData = Array.isArray(patientsRes.data) ? patientsRes.data : patientsRes.data?.patients || []
        if (presetPatientId && !patientsData.some((patient: any) => patient._id === presetPatientId)) {
          try {
            const patientRes = await api.get(`/patients/${presetPatientId}`)
            const patient = patientRes.data?.patient || patientRes.data
            if (patient) {
              patientsData = [...patientsData, patient]
            }
          } catch (patientErr) {
            console.warn('Failed to fetch preset patient for treatment plan:', patientErr)
          }
        }

        let doctorsData = Array.isArray(doctorsRes.data) ? doctorsRes.data : doctorsRes.data?.doctors || doctorsRes.data?.users || []
        if (presetDoctorId && !doctorsData.some((doctor: any) => doctor._id === presetDoctorId)) {
          try {
            const doctorRes = await api.get(`/users/${presetDoctorId}`)
            const doctor = doctorRes.data?.user || doctorRes.data
            if (doctor) {
              doctorsData = [...doctorsData, doctor]
            }
          } catch (doctorErr) {
            console.warn('Failed to fetch preset doctor for treatment plan:', doctorErr)
          }
        }

        setPatients(patientsData)
        setDoctors(doctorsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      }
    }

    fetchData()
  }, [presetPatientId, presetDoctorId])

  useEffect(() => {
    if (presetPatientId) {
      setFormData((prev) => ({ ...prev, patientId: presetPatientId }))
      setLockedPatient(true)
    }
  }, [presetPatientId])

  useEffect(() => {
    if (presetDoctorId) {
      setFormData((prev) => ({ ...prev, doctorId: presetDoctorId }))
      setLockedDoctor(true)
    }
  }, [presetDoctorId])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleStepChange = (index: number, field: string, value: string) => {
    const updatedSteps = [...steps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setSteps(updatedSteps)
  }

  const addStep = () => {
    setSteps([...steps, { title: '', description: '', plannedDate: '', cost: '', teethInvolved: '' }])
  }

  const removeStep = (index: number) => {
    if (steps.length === 1) return
    const updatedSteps = steps.filter((_, i) => i !== index)
    setSteps(updatedSteps)
  }

  const calculateTotalCost = () => {
    return steps.reduce((total, step) => {
      const cost = parseFloat(step.cost) || 0
      return total + cost
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.patientId || !formData.title) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (steps.some(step => !step.title)) {
      toast.error('Please fill in all step titles')
      return
    }
    
    setLoading(true)
    
    try {
      const treatmentPlanData = {
        patient: formData.patientId,
        doctor: formData.doctorId || undefined,
        title: formData.title,
        description: formData.description,
        steps: steps.map(step => ({
          title: step.title,
          description: step.description,
          plannedDate: step.plannedDate || undefined,
          cost: parseFloat(step.cost) || 0,
          teethInvolved: step.teethInvolved ? step.teethInvolved.split(',').map((t: string) => t.trim()) : []
        })),
        startDate: formData.startDate || undefined,
        estimatedDuration: formData.estimatedDuration || undefined,
        totalCost: calculateTotalCost(),
        caseId: presetCaseId || undefined
      }
      
      await api.post('/treatment-plans', treatmentPlanData)
      toast.success('Treatment plan created successfully')
      router.push('/treatment-plans')
    } catch (error) {
      console.error('Error creating treatment plan:', error)
      toast.error('Failed to create treatment plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Create Treatment Plan</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Patient *</label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
                disabled={lockedPatient}
                required
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name}
                  </option>
                ))}
              </select>
              {lockedPatient && (
                <p className="text-xs text-secondary-500 mt-1">
                  Patient pre-selected from appointment case.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Doctor</label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
                disabled={lockedDoctor}
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
              {lockedDoctor && (
                <p className="text-xs text-secondary-500 mt-1">
                  Doctor pre-selected from appointment case.
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Treatment plan title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="w-full border rounded px-3 py-2 h-24"
              placeholder="Treatment plan description..."
            />
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Treatment Steps</h2>
              <button
                type="button"
                onClick={addStep}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                <Plus size={16} className="mr-1" /> Add Step
              </button>
            </div>
            
            {steps.map((step, index) => (
              <div key={index} className="border rounded p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Step #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-red-500"
                    disabled={steps.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Step title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Planned Date</label>
                    <input
                      type="date"
                      value={step.plannedDate}
                      onChange={(e) => handleStepChange(index, 'plannedDate', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cost (₹)</label>
                    <input
                      type="number"
                      value={step.cost}
                      onChange={(e) => handleStepChange(index, 'cost', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Teeth Involved</label>
                    <input
                      type="text"
                      value={step.teethInvolved}
                      onChange={(e) => handleStepChange(index, 'teethInvolved', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., 11, 12, 21"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={step.description}
                    onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                    className="w-full border rounded px-3 py-2 h-20"
                    placeholder="Step description..."
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Duration</label>
              <input
                type="text"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., 3 weeks"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Total Cost</label>
              <div className="w-full border rounded px-3 py-2 bg-gray-50">
                ₹{calculateTotalCost().toFixed(2)}
              </div>
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
                  <Calendar size={18} className="mr-2" /> Create Treatment Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}