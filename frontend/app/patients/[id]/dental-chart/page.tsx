'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Tooth } from '@/components/dental/Tooth'
import { ToothDetails } from '@/components/dental/ToothDetails'
import toast from 'react-hot-toast'

// Dental chart notation systems
const FDI_TEETH = [
  // Upper right quadrant (1)
  '18', '17', '16', '15', '14', '13', '12', '11',
  // Upper left quadrant (2)
  '21', '22', '23', '24', '25', '26', '27', '28',
  // Lower left quadrant (3)
  '38', '37', '36', '35', '34', '33', '32', '31',
  // Lower right quadrant (4)
  '41', '42', '43', '44', '45', '46', '47', '48'
]

export default function DentalChartPage() {
  const { id } = useParams()
  const [patient, setPatient] = useState<any>(null)
  const [dentalChart, setDentalChart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [notationSystem, setNotationSystem] = useState('fdi')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch patient data
        const patientRes = await api.get(`/patients/${id}`)
        setPatient(patientRes.data)
        
        // Fetch dental chart
        const chartRes = await api.get(`/dental-charts/patient/${id}`)
        setDentalChart(chartRes.data)
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load dental chart')
        setLoading(false)
      }
    }
    
    if (id) {
      fetchData()
    }
  }, [id])

  const handleToothClick = (toothNumber: string) => {
    setSelectedTooth(toothNumber)
  }

  const handleToothUpdate = async (toothNumber: string, data: any) => {
    try {
      const res = await api.put(`/dental-charts/patient/${id}/tooth/${toothNumber}`, data)
      setDentalChart(res.data)
      toast.success('Tooth information updated')
    } catch (error) {
      console.error('Error updating tooth:', error)
      toast.error('Failed to update tooth information')
    }
  }

  const handleAddTreatment = async (toothNumber: string, treatmentData: any) => {
    try {
      const res = await api.post(`/dental-charts/patient/${id}/tooth/${toothNumber}/treatment`, treatmentData)
      setDentalChart(res.data)
      toast.success('Treatment added successfully')
    } catch (error) {
      console.error('Error adding treatment:', error)
      toast.error('Failed to add treatment')
    }
  }

  const handleAddImage = async (toothNumber: string, imageData: any) => {
    try {
      const res = await api.post(`/dental-charts/patient/${id}/tooth/${toothNumber}/image`, imageData)
      setDentalChart(res.data)
      toast.success('Image added successfully')
    } catch (error) {
      console.error('Error adding image:', error)
      toast.error('Failed to add image')
    }
  }

  const getToothData = (toothNumber: string) => {
    if (!dentalChart || !dentalChart.teeth) return null
    return dentalChart.teeth.find((t: any) => t.number === toothNumber) || {
      number: toothNumber,
      condition: 'healthy',
      treatments: [],
      images: []
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner h-8 w-8"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Dental Chart: {patient?.name}
          </h1>
          <div className="flex items-center space-x-4">
            <select
              value={notationSystem}
              onChange={(e) => setNotationSystem(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="fdi">FDI Notation</option>
              <option value="universal">Universal Notation</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Upper Jaw</h2>
            <div className="grid grid-cols-8 gap-2">
              {FDI_TEETH.slice(0, 16).map((toothNumber) => (
                <Tooth
                  key={toothNumber}
                  number={toothNumber}
                  data={getToothData(toothNumber)}
                  onClick={() => handleToothClick(toothNumber)}
                  isSelected={selectedTooth === toothNumber}
                  notationSystem={notationSystem}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Lower Jaw</h2>
            <div className="grid grid-cols-8 gap-2">
              {FDI_TEETH.slice(16).map((toothNumber) => (
                <Tooth
                  key={toothNumber}
                  number={toothNumber}
                  data={getToothData(toothNumber)}
                  onClick={() => handleToothClick(toothNumber)}
                  isSelected={selectedTooth === toothNumber}
                  notationSystem={notationSystem}
                />
              ))}
            </div>
          </div>
        </div>

        {selectedTooth && (
          <ToothDetails
            toothNumber={selectedTooth}
            data={getToothData(selectedTooth)}
            onUpdate={(data) => handleToothUpdate(selectedTooth, data)}
            onAddTreatment={(data) => handleAddTreatment(selectedTooth, data)}
            onAddImage={(data) => handleAddImage(selectedTooth, data)}
            onClose={() => setSelectedTooth(null)}
            notationSystem={notationSystem}
          />
        )}
      </div>
    </DashboardLayout>
  )
}