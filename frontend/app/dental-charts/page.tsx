'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Search, 
  Activity,
  User,
  Calendar
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function DentalChartsPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!token) {
      router.push('/login')
      return
    }

    const fetchPatients = async () => {
      try {
        setLoading(true)
        const res = await api.get('/patients')
        setPatients(res.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching patients:', error)
        toast.error('Failed to load patients')
        setLoading(false)
      }
    }

    fetchPatients()
  }, [token, router])

  // Filter patients based on search term
  const filteredPatients = Array.isArray(patients) ? patients.filter((patient: any) => 
    (patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (patient.phone?.includes(searchTerm) || false)
  ) : []

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-secondary-900 mb-4 md:mb-0">
              Dental Charts
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-secondary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary-400" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="loading-spinner h-8 w-8"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient: any) => (
                  <Link 
                    href={`/patients/${patient._id}/dental-chart`} 
                    key={patient._id}
                    className="block"
                  >
                    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-secondary-900">{patient.name}</h3>
                            <p className="text-sm text-secondary-500">ID: {patient._id.slice(-8)}</p>
                          </div>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-secondary-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Age: {patient.age} years</span>
                        </div>
                        <div className="flex items-center text-secondary-600">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            patient.gender === 'male' ? 'bg-blue-500' : 
                            patient.gender === 'female' ? 'bg-pink-500' : 'bg-gray-500'
                          }`}></div>
                          <span className="capitalize">{patient.gender}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-secondary-100">
                        <p className="text-sm text-secondary-600">
                          <span className="font-medium">Last Visit:</span> {
                            patient.lastVisit ? formatDate(patient.lastVisit) : 'No visits recorded'
                          }
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-secondary-500">No patients found</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}