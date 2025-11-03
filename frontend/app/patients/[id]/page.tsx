'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ArrowLeft, Edit, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

interface Patient {
  _id: string
  name?: string
  contact?: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  issue?: string
  address?: string
  emergencyContact?: string
  medicalHistory?: string
  allergies?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export default function PatientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        if (!id) return
        const { data } = await api.get(`/patients/${id}`)
        setPatient(data?.patient || data)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to load patient')
      } finally {
        setLoading(false)
      }
    }
    fetchPatient()
  }, [id])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-md hover:bg-secondary-100"
            >
              <ArrowLeft className="h-5 w-5 text-secondary-600" />
            </button>
            <h1 className="text-xl font-semibold">Patient Details</h1>
          </div>
          {id && (
            <div className="flex items-center space-x-2">
              <Link href={`/patients/${id}/dental-chart`}>
                <button className="btn btn-outline btn-sm flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Dental Chart</span>
                </button>
              </Link>
              <Link href={`/patients/${id}/edit`}>
                <button className="btn btn-primary btn-sm flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-secondary-600">Loading patient...</p>
          </div>
        ) : !patient ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-error-600">Patient not found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-secondary-500">Name</p>
                <p className="text-secondary-900 font-medium">{patient.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Contact</p>
                <p className="text-secondary-900 font-medium">{patient.contact || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Age</p>
                <p className="text-secondary-900 font-medium">{patient.age ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Gender</p>
                <p className="text-secondary-900 font-medium">{patient.gender || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-secondary-500">Issue</p>
                <p className="text-secondary-900 font-medium">{patient.issue || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-secondary-500">Address</p>
                <p className="text-secondary-900 font-medium">{patient.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Emergency Contact</p>
                <p className="text-secondary-900 font-medium">{patient.emergencyContact || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Medical History</p>
                <p className="text-secondary-900 font-medium">{patient.medicalHistory || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Allergies</p>
                <p className="text-secondary-900 font-medium">{patient.allergies || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}