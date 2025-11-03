'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  TrendingUp,
  CheckCircle,
  UserCheck
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalPatients: number
  totalAppointments: number
  todayAppointments: number
  confirmedAppointments: number
  completedAppointments: number
  cancelledAppointments: number
}

interface RecentAppointment {
  _id: string
  patient?: {
    name: string
    contact: string
  } | null
  doctor?: {
    name: string
  } | null
  date: string
  time: string
  status: string
  type: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch appointment stats
      const appointmentStatsResponse = await api.get('/appointments/stats')
      const appointmentStats = appointmentStatsResponse.data

      // Fetch patient stats
      const patientStatsResponse = await api.get('/patients/stats')
      const patientStats = patientStatsResponse.data

      // Fetch recent appointments
      const appointmentsResponse = await api.get('/appointments?limit=5&sortBy=date&sortOrder=desc')
      const appointments = appointmentsResponse.data.appointments

      setStats({
        totalPatients: patientStats.totalPatients,
        totalAppointments: appointmentStats.totalAppointments,
        todayAppointments: appointmentStats.todayAppointments,
        confirmedAppointments: appointmentStats.confirmedAppointments,
        completedAppointments: appointmentStats.completedAppointments,
        cancelledAppointments: appointmentStats.cancelledAppointments
      })

      setRecentAppointments(appointments)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getRoleBasedDescription = () => {
    switch (user?.role) {
      case 'admin':
        return 'Manage users, view system statistics, and oversee hospital operations'
      case 'doctor':
        return 'Manage your patients, appointments, and treatment records'
      case 'receptionist':
        return 'Manage patient registrations, appointments, and daily operations'
      default:
        return 'Welcome to the hospital management system'
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
      <div>
        {/* Main Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">
            {getGreeting()}, {user?.name || 'User'}!
          </h1>
          <p className="text-base sm:text-lg text-secondary-600 mt-2">
            {getRoleBasedDescription()}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div
            onClick={() => router.push('/patients')}
            className="bg-white rounded-lg border border-secondary-200 p-4 shadow-sm h-full cursor-pointer hover:bg-secondary-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Patients</p>
                <p className="text-2xl font-bold text-secondary-900 mt-1">
                  {stats?.totalPatients || 0}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              const today = new Date().toISOString().slice(0,10)
              router.push(`/appointments?date=${today}`)
            }}
            className="bg-white rounded-lg border border-secondary-200 p-4 shadow-sm h-full cursor-pointer hover:bg-secondary-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-secondary-900 mt-1">
                  {stats?.todayAppointments || 0}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <Calendar className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push('/appointments?status=confirmed')}
            className="bg-white rounded-lg border border-secondary-200 p-4 shadow-sm h-full cursor-pointer hover:bg-secondary-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Confirmed</p>
                <p className="text-2xl font-bold text-secondary-900 mt-1">
                  {stats?.confirmedAppointments || 0}
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-warning-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push('/appointments?status=completed')}
            className="bg-white rounded-lg border border-secondary-200 p-4 shadow-sm h-full cursor-pointer hover:bg-secondary-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Completed</p>
                <p className="text-2xl font-bold text-secondary-900 mt-1">
                  {stats?.completedAppointments || 0}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Appointments and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <div className="bg-white rounded-lg border border-secondary-200 shadow-sm h-full">
            <div className="p-4 border-b border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900">Recent Appointments</h3>
              <p className="text-sm text-secondary-500 mt-1">
                Latest appointments in the system
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-100 rounded-full">
                          <UserCheck className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">
                            {appointment.patient?.name || 'Unknown Patient'}
                          </p>
                          <p className="text-xs text-secondary-500">
                            Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-secondary-900">
                          {formatDate(appointment.date)}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {appointment.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-secondary-500 text-center py-4">
                    No recent appointments found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-secondary-200 shadow-sm h-full">
            <div className="p-4 border-b border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900">Quick Actions</h3>
              <p className="text-sm text-secondary-500 mt-1">
                Common tasks and shortcuts
              </p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/patients')}
                  className="p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-center"
                >
                  <Users className="h-5 w-5 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary-900">Add Patient</p>
                </button>
                
                <button
                  onClick={() => router.push('/appointments')}
                  className="p-3 bg-success-50 rounded-lg hover:bg-success-100 transition-colors text-center"
                >
                  <Calendar className="h-5 w-5 text-success-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-success-900">Book Appointment</p>
                </button>
                
                {user?.role === 'doctor' && (
                  <button
                    onClick={() => router.push('/treatments')}
                    className="p-3 bg-warning-50 rounded-lg hover:bg-warning-100 transition-colors text-center"
                  >
                    <Stethoscope className="h-5 w-5 text-warning-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-warning-900">Add Treatment</p>
                  </button>
                )}
                
                {user?.role === 'admin' && (
                  <button
                    onClick={() => router.push('/users')}
                    className="p-3 bg-error-50 rounded-lg hover:bg-error-100 transition-colors text-center"
                  >
                    <UserCheck className="h-5 w-5 text-error-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-error-900">Manage Users</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}