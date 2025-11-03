'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface PatientForm {
  name: string
  contact: string
  age: number | ''
  gender: 'male' | 'female' | 'other' | ''
  issue: string
  address: string
  emergencyContact: string
  medicalHistory: string
  allergies: string
}

export default function EditPatientPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [form, setForm] = useState<PatientForm>({
    name: '',
    contact: '',
    age: '',
    gender: '',
    issue: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        if (!id) return
        const { data } = await api.get(`/patients/${id}`)
        const p = data?.patient || data
        setForm({
          name: p?.name || '',
          contact: p?.contact || '',
          age: typeof p?.age === 'number' ? p.age : '',
          gender: (p?.gender as any) || '',
          issue: p?.issue || '',
          address: p?.address || '',
          emergencyContact: p?.emergencyContact || '',
          medicalHistory: p?.medicalHistory || '',
          allergies: p?.allergies || ''
        })
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to load patient')
      } finally {
        setLoading(false)
      }
    }
    fetchPatient()
  }, [id])

  const handleChange = (key: keyof PatientForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload: any = {
        name: form.name,
        contact: form.contact,
        issue: form.issue,
      }
      if (form.age !== '') payload.age = Number(form.age)
      if (form.gender !== '') payload.gender = form.gender
      if (form.address) payload.address = form.address
      if (form.emergencyContact) payload.emergencyContact = form.emergencyContact
      if (form.medicalHistory) payload.medicalHistory = form.medicalHistory
      if (form.allergies) payload.allergies = form.allergies

      await api.put(`/patients/${id}`, payload)
      toast.success('Patient updated')
      router.push(`/patients/${id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update patient')
    } finally {
      setSaving(false)
    }
  }

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
            <h1 className="text-xl font-semibold">Edit Patient</h1>
          </div>
          {id && (
            <Link href={`/patients/${id}`}>
              <button className="btn btn-outline btn-sm">Back to Details</button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-secondary-600">Loading patient...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="input"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="label">Contact *</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  className="input"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="label">Age</label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={form.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className="input"
                  placeholder="Enter age"
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value as any)}
                  className="input"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Issue *</label>
                <textarea
                  value={form.issue}
                  onChange={(e) => handleChange('issue', e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Describe the issue"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="input"
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="label">Emergency Contact</label>
                <input
                  type="text"
                  value={form.emergencyContact}
                  onChange={(e) => handleChange('emergencyContact', e.target.value)}
                  className="input"
                  placeholder="Enter emergency contact"
                />
              </div>
              <div>
                <label className="label">Medical History</label>
                <input
                  type="text"
                  value={form.medicalHistory}
                  onChange={(e) => handleChange('medicalHistory', e.target.value)}
                  className="input"
                  placeholder="Enter medical history"
                />
              </div>
              <div>
                <label className="label">Allergies</label>
                <input
                  type="text"
                  value={form.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  className="input"
                  placeholder="Enter allergies"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary btn-md flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}