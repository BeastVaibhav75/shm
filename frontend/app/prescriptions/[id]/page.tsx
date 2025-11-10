'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Download, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PrescriptionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [prescription, setPrescription] = useState<any | null>(null)

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/prescriptions/${id}`)
        setPrescription(res.data)
      } catch (error) {
        console.error('Error loading prescription:', error)
        toast.error('Failed to load prescription')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchPrescription()
  }, [id])

  const handleGeneratePDF = async () => {
    try {
      await api.get(`/prescriptions/${id}/generate-pdf`)
      toast.success('PDF generated')
    } catch (error) {
      console.error('PDF error:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleSend = async (method: string) => {
    try {
      await api.post(`/prescriptions/${id}/send`, { method })
      toast.success(`Sent via ${method}`)
    } catch (error) {
      console.error('Send error:', error)
      toast.error('Failed to send')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner h-8 w-8"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!prescription) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-secondary-600">Prescription not found.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-secondary-900">Prescription</h1>
            <p className="text-secondary-600">
              Patient: {prescription.patient?.name || 'Unknown'} • Doctor: {prescription.doctor?.name || '—'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGeneratePDF} className="px-3 py-2 rounded bg-secondary-100 hover:bg-secondary-200 text-secondary-900">
              <Download className="h-4 w-4 inline-block mr-1" /> PDF
            </button>
            <button onClick={() => handleSend('whatsapp')} className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white">
              <Send className="h-4 w-4 inline-block mr-1" /> WhatsApp
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-secondary-200 shadow-sm">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-2">Diagnosis</h2>
            <p className="text-secondary-700">{prescription.diagnosis || '—'}</p>
          </div>
          <div className="border-t p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-2">Medicines</h2>
            <div className="space-y-2">
              {(prescription.medicines || []).map((m: any, idx: number) => (
                <div key={idx} className="p-3 bg-secondary-50 rounded">
                  <p className="font-medium text-secondary-900">{m.name}</p>
                  <p className="text-sm text-secondary-700">
                    Dosage: {m.dosage} • Frequency: {m.frequency} • Duration: {m.duration}
                  </p>
                  {m.instructions ? <p className="text-sm text-secondary-600">Instructions: {m.instructions}</p> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-2">General Instructions</h2>
            <p className="text-secondary-700">{prescription.generalInstructions || '—'}</p>
          </div>
        </div>

        <div>
          <button onClick={() => router.push('/prescriptions')} className="px-3 py-2 rounded border">
            Back
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

