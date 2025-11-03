'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ArrowLeft, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  _id: string
  name?: string
  email?: string
  role?: 'admin' | 'doctor' | 'receptionist'
  phone?: string
  specialization?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!id) return
        const { data } = await api.get(`/users/${id}`)
        setUser(data?.user || data)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
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
            <h1 className="text-xl font-semibold">User Details</h1>
          </div>
          {id && (
            <Link href={`/users/${id}/edit`}>
              <button className="btn btn-primary btn-sm flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-secondary-600">Loading user...</p>
          </div>
        ) : !user ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-error-600">User not found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-secondary-500">Name</p>
                <p className="text-secondary-900 font-medium">{user.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Email</p>
                <p className="text-secondary-900 font-medium">{user.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Role</p>
                <p className="text-secondary-900 font-medium">{user.role || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Phone</p>
                <p className="text-secondary-900 font-medium">{user.phone || '-'}</p>
              </div>
              {user.role === 'doctor' && (
                <div>
                  <p className="text-sm text-secondary-500">Specialization</p>
                  <p className="text-secondary-900 font-medium">{user.specialization || '-'}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-secondary-500">Status</p>
                <p className="text-secondary-900 font-medium">{user.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}