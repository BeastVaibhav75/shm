'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Plus, FileText, Send, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true)
        const res = await api.get('/prescriptions')
        const data = Array.isArray(res.data) ? res.data : res.data?.prescriptions || []
        setPrescriptions(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching prescriptions:', error)
        toast.error('Failed to load prescriptions')
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [])

  const handleGeneratePDF = async (id: string) => {
    try {
      await api.get(`/prescriptions/${id}/generate-pdf`)
      toast.success('PDF generated successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleSendPrescription = async (id: string, method: string) => {
    try {
      await api.post(`/prescriptions/${id}/send`, { method })
      toast.success(`Prescription sent via ${method}`)
    } catch (error) {
      console.error('Error sending prescription:', error)
      toast.error('Failed to send prescription')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <Link href="/prescriptions/create">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center">
              <Plus size={18} className="mr-2" /> New Prescription
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {prescriptions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicines
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prescriptions.map((prescription) => (
                    <tr key={prescription._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {prescription.patient?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {prescription.doctor?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {prescription.diagnosis || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {prescription.medicines?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleGeneratePDF(prescription._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Generate PDF"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleSendPrescription(prescription._id, 'whatsapp')}
                            className="text-green-600 hover:text-green-800"
                            title="Send via WhatsApp"
                          >
                            <Send size={18} />
                          </button>
                          <Link href={`/prescriptions/${prescription._id}`}>
                            <button className="text-gray-600 hover:text-gray-800" title="View Details">
                              <FileText size={18} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No prescriptions found</p>
                <Link href="/prescriptions/create">
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Create Your First Prescription
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}