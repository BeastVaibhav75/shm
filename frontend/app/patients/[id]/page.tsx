'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ArrowLeft, Edit, Activity, Calendar, FileText, ClipboardList, IndianRupee, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'

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
  assignedDoctor?: {
    _id: string
    name: string
    specialization?: string
  }
}

export default function PatientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedLoading, setRelatedLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'billing' | 'treatments'>('overview')
  const [appointments, setAppointments] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([])

const tabs = useMemo(() => ([
  { key: 'overview', label: 'Overview' },
  { key: 'appointments', label: `Appointments (${appointments.length})` },
  { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})` },
  { key: 'billing', label: `Billing (${invoices.length})` },
  { key: 'treatments', label: `Treatments (${treatmentPlans.length})` }
]), [appointments.length, prescriptions.length, invoices.length, treatmentPlans.length])

const totalAppointments = appointments.length
const totalPrescriptions = prescriptions.length
const activeTreatmentPlansCount = useMemo(
  () => treatmentPlans.filter(plan => (plan.status || '').toLowerCase() !== 'completed').length,
  [treatmentPlans]
)

const unpaidInvoicesCount = useMemo(
  () => invoices.filter(invoice => (invoice.status || '').toLowerCase() !== 'paid').length,
  [invoices]
)

const outstandingAmount = useMemo(
  () =>
    invoices
      .filter(invoice => (invoice.status || '').toLowerCase() !== 'paid')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0),
  [invoices]
)

const upcomingAppointment = useMemo(() => {
  const upcoming = appointments
    .filter(appt => appt?.date && new Date(appt.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return upcoming.length > 0 ? upcoming[0] : null
}, [appointments])

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value || 0)
  } catch (error) {
    return `₹${(value || 0).toFixed(0)}`
  }
}

const getInvoiceBadgeClass = (status: string = '') => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-success-100 text-success-700 border-success-200'
    case 'partially paid':
      return 'bg-warning-100 text-warning-700 border-warning-200'
    default:
      return 'bg-error-100 text-error-700 border-error-200'
  }
}

const renderAppointmentsTable = (records: any[]) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-secondary-900">Appointments</h3>
      <Link href="/appointments">
        <button className="btn btn-outline btn-sm">Manage Appointments</button>
      </Link>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Date</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Time</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Doctor</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Case ID</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-200 bg-white">
          {records.map((appointment) => (
            <tr key={appointment._id}>
              <td className="px-4 py-3 text-sm text-secondary-900">{appointment.date ? formatDate(appointment.date) : '—'}</td>
              <td className="px-4 py-3 text-sm text-secondary-900">{appointment.time ? formatTime(appointment.time) : '—'}</td>
              <td className="px-4 py-3 text-sm text-secondary-900">{appointment.doctor?.name || '—'}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded-full ${getStatusColor(appointment.status || '')}`}>
                  {appointment.status || '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-secondary-900">{appointment.caseId || '—'}</td>
              <td className="px-4 py-3 text-sm text-right">
                {appointment.caseId ? (
                  <Link href={`/appointments/${appointment.caseId}`} className="text-primary-600 hover:text-primary-700">
                    View Case
                  </Link>
                ) : (
                  <span className="text-secondary-400">No case</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const renderPrescriptionsTable = (records: any[]) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-secondary-900">Prescriptions</h3>
      <Link href={`/prescriptions/create?patientId=${patient?._id || ''}`}>
        <button className="btn btn-outline btn-sm">Create Prescription</button>
      </Link>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Date</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Diagnosis</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Doctor</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Medicines</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-200 bg-white">
          {records.map((prescription) => (
            <tr key={prescription._id}>
              <td className="px-4 py-3 text-sm text-secondary-900">{prescription.createdAt ? formatDate(prescription.createdAt) : '—'}</td>
              <td className="px-4 py-3 text-sm text-secondary-900">{prescription.diagnosis || '—'}</td>
              <td className="px-4 py-3 text-sm text-secondary-900">{prescription.doctor?.name || '—'}</td>
              <td className="px-4 py-3 text-sm text-secondary-900">{prescription.medicines?.length || 0}</td>
              <td className="px-4 py-3 text-sm text-right">
                <Link href={`/prescriptions/${prescription._id}`} className="text-primary-600 hover:text-primary-700 inline-flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const renderInvoicesTable = (records: any[]) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-secondary-900">Bills & Invoices</h3>
      <Link href="/invoices">
        <button className="btn btn-outline btn-sm">Manage Invoices</button>
      </Link>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Issued</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Total</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Case ID</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-200 bg-white">
          {records.map((invoice) => (
            <tr key={invoice._id}>
              <td className="px-4 py-3 text-sm text-secondary-900">{invoice.issuedAt ? formatDate(invoice.issuedAt) : '—'}</td>
              <td className="px-4 py-3 text-sm text-secondary-900">{formatCurrency(Number(invoice.total) || 0)}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded-full ${getInvoiceBadgeClass(invoice.status)}`}>
                  {invoice.status || 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-secondary-900">{invoice.caseId || '—'}</td>
              <td className="px-4 py-3 text-sm text-right">
                <Link href={`/invoices/${invoice._id}`} className="text-primary-600 hover:text-primary-700 inline-flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>Open</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const renderTreatmentPlansList = (records: any[]) => (
  <div className="space-y-4">
    {records.map((plan) => {
      const steps = Array.isArray(plan.steps) ? plan.steps : []
      const completedSteps = steps.filter((step: any) => (step.status || '').toLowerCase() === 'completed').length
      const progress = steps.length ? Math.round((completedSteps / steps.length) * 100) : plan.progress || 0

      return (
        <div key={plan._id} className="bg-white rounded-lg shadow p-6 border border-secondary-200">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">{plan.title || 'Treatment Plan'}</h3>
              <p className="text-sm text-secondary-600">
                Doctor: {plan.doctor?.name || '—'} {plan.doctor?.specialization ? `• ${plan.doctor.specialization}` : ''}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full border text-xs font-medium ${
              (plan.status || '').toLowerCase() === 'completed'
                ? 'bg-success-100 text-success-700 border-success-200'
                : (plan.status || '').toLowerCase() === 'cancelled'
                  ? 'bg-error-100 text-error-700 border-error-200'
                  : 'bg-warning-100 text-warning-700 border-warning-200'
            }`}>
              {plan.status || 'Active'}
            </span>
          </div>

          <div className="mt-4">
            <div className="h-2 bg-secondary-100 rounded-full">
              <div className="h-2 bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-secondary-600">
              Progress: {progress}% • Steps: {steps.length} • Completed: {completedSteps}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-secondary-700">
            <p>Start: {plan.startDate ? formatDate(plan.startDate) : '—'}</p>
            <p>Status: {plan.status || 'Active'}</p>
            <p>Total Cost: {formatCurrency(Number(plan.totalCost) || 0)}</p>
          </div>

          {plan.description ? (
            <p className="mt-4 text-sm text-secondary-700">
              {plan.description}
            </p>
          ) : null}
        </div>
      )
    })}
  </div>
)

const renderTabContent = () => {
  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-secondary-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Appointments</p>
              <p className="text-2xl font-semibold text-secondary-900">{totalAppointments}</p>
            </div>
            <Calendar className="h-6 w-6 text-primary-500" />
          </div>

          <div className="bg-white border border-secondary-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Prescriptions</p>
              <p className="text-2xl font-semibold text-secondary-900">{totalPrescriptions}</p>
            </div>
            <FileText className="h-6 w-6 text-primary-500" />
          </div>

          <div className="bg-white border border-secondary-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Active Treatments</p>
              <p className="text-2xl font-semibold text-secondary-900">{activeTreatmentPlansCount}</p>
            </div>
            <ClipboardList className="h-6 w-6 text-primary-500" />
          </div>

          <div className="bg-white border border-secondary-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Outstanding Balance</p>
              <p className="text-2xl font-semibold text-secondary-900">{formatCurrency(outstandingAmount)}</p>
              <p className="text-xs text-secondary-500 mt-1">{unpaidInvoicesCount} unpaid bill(s)</p>
            </div>
            <IndianRupee className="h-6 w-6 text-primary-500" />
          </div>
        </div>

        <div className="bg-white border border-secondary-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Upcoming Appointment</h3>
              <p className="text-sm text-secondary-600">Keep track of the next visit from this patient</p>
            </div>
            <Link href="/appointments">
              <button className="btn btn-outline btn-sm">View Schedule</button>
            </Link>
          </div>
          {upcomingAppointment ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-secondary-700">
              <div>
                <p className="font-semibold text-secondary-900">{formatDate(upcomingAppointment.date)}</p>
                <p>{upcomingAppointment.time ? formatTime(upcomingAppointment.time) : '—'}</p>
              </div>
              <div>
                <p className="text-secondary-500">Doctor</p>
                <p>{upcomingAppointment.doctor?.name || '—'}</p>
              </div>
              <div>
                <p className="text-secondary-500">Status</p>
                <span className={`inline-flex items-center px-2 py-1 mt-1 text-xs font-medium border rounded-full ${getStatusColor(upcomingAppointment.status || '')}`}>
                  {upcomingAppointment.status || '—'}
                </span>
              </div>
              <div>
                <p className="text-secondary-500">Case</p>
                {upcomingAppointment.caseId ? (
                  <Link href={`/appointments/${upcomingAppointment.caseId}`} className="text-primary-600 hover:text-primary-700">
                    {upcomingAppointment.caseId}
                  </Link>
                ) : (
                  <span className="text-secondary-500">—</span>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-secondary-600">No upcoming appointments scheduled.</p>
          )}
        </div>
      </div>
    )
  }

  if (relatedLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-secondary-600">Loading patient records...</p>
      </div>
    )
  }

  switch (activeTab) {
    case 'appointments':
      return appointments.length
        ? renderAppointmentsTable(appointments)
        : (
          <div className="bg-white rounded-lg shadow p-6 text-center space-y-4">
            <p className="text-secondary-600">No appointments found for this patient.</p>
            <Link href="/appointments">
              <button className="btn btn-primary btn-sm">Book Appointment</button>
            </Link>
          </div>
        )
    case 'prescriptions':
      return prescriptions.length
        ? renderPrescriptionsTable(prescriptions)
        : (
          <div className="bg-white rounded-lg shadow p-6 text-center space-y-4">
            <p className="text-secondary-600">No prescriptions recorded yet.</p>
            <Link href={`/prescriptions/create?patientId=${patient?._id || ''}`}>
              <button className="btn btn-primary btn-sm">Create Prescription</button>
            </Link>
          </div>
        )
    case 'billing':
      return invoices.length
        ? renderInvoicesTable(invoices)
        : (
          <div className="bg-white rounded-lg shadow p-6 text-center space-y-4">
            <p className="text-secondary-600">No invoices found for this patient.</p>
            <Link href="/invoices">
              <button className="btn btn-primary btn-sm">Create Invoice</button>
            </Link>
          </div>
        )
    case 'treatments':
      return treatmentPlans.length
        ? renderTreatmentPlansList(treatmentPlans)
        : (
          <div className="bg-white rounded-lg shadow p-6 text-center space-y-4">
            <p className="text-secondary-600">No treatment plans created yet.</p>
            <Link href={`/treatment-plans/create?patientId=${patient?._id || ''}`}>
              <button className="btn btn-primary btn-sm">Create Treatment Plan</button>
            </Link>
          </div>
        )
    default:
      return null
  }
}

  useEffect(() => {
    if (!id) return

    const fetchPatient = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/patients/${id}`)
        setPatient(data?.patient || data)
      } catch (err: any) {
        console.error('Failed to load patient', err)
        toast.error(err?.response?.data?.message || 'Failed to load patient')
      } finally {
        setLoading(false)
      }
    }

    const fetchRelatedData = async () => {
      try {
        setRelatedLoading(true)
        const [
          appointmentsResult,
          prescriptionsResult,
          invoicesResult,
          treatmentPlansResult
        ] = await Promise.allSettled([
          api.get(`/appointments?patient=${id}&limit=50&sortBy=date&sortOrder=desc`),
          api.get(`/prescriptions?patientId=${id}&limit=50`),
          api.get(`/invoices?patientId=${id}`),
          api.get(`/treatment-plans?patientId=${id}&limit=50`)
        ])

        if (appointmentsResult.status === 'fulfilled') {
          const data = appointmentsResult.value.data?.appointments || appointmentsResult.value.data || []
          setAppointments(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to load appointments', appointmentsResult.reason)
          toast.error('Failed to load appointments')
        }

        if (prescriptionsResult.status === 'fulfilled') {
          const data = prescriptionsResult.value.data?.prescriptions || prescriptionsResult.value.data || []
          setPrescriptions(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to load prescriptions', prescriptionsResult.reason)
          toast.error('Failed to load prescriptions')
        }

        if (invoicesResult.status === 'fulfilled') {
          const data = invoicesResult.value.data?.invoices || invoicesResult.value.data || []
          setInvoices(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to load invoices', invoicesResult.reason)
          toast.error('Failed to load invoices')
        }

        if (treatmentPlansResult.status === 'fulfilled') {
          const data = treatmentPlansResult.value.data?.treatmentPlans || treatmentPlansResult.value.data || []
          setTreatmentPlans(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to load treatment plans', treatmentPlansResult.reason)
          toast.error('Failed to load treatment plans')
        }
      } finally {
        setRelatedLoading(false)
      }
    }

    fetchPatient()
    fetchRelatedData()
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
        <>
          <div className="bg-white rounded-lg shadow p-6 border border-secondary-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-secondary-500">Name</p>
                <p className="text-secondary-900 font-medium text-lg">{patient.name || '-'}</p>
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
                <p className="text-secondary-900 font-medium capitalize">{patient.gender || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Assigned Doctor</p>
                <p className="text-secondary-900 font-medium">
                  {patient.assignedDoctor?.name || '—'}
                  {patient.assignedDoctor?.specialization ? ` • ${patient.assignedDoctor.specialization}` : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Status</p>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded-full ${
                  patient.isActive ? 'bg-success-100 text-success-700 border-success-200' : 'bg-secondary-100 text-secondary-700 border-secondary-200'
                }`}>
                  {patient.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-secondary-500">Primary Issue</p>
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

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition ${
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {renderTabContent()}
          </div>
        </>
        )}
      </div>
    </DashboardLayout>
  )
}