'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

type DateRange = { start: string; end: string }

export default function ReportsPage() {
  const { user } = useAuth()
  const [range, setRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(end.getMonth() - 3)
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    }
  })

  const [loading, setLoading] = useState(false)
  const [monthly, setMonthly] = useState<any>(null)
  const [treatmentRevenue, setTreatmentRevenue] = useState<any[]>([])
  const [doctorPerformance, setDoctorPerformance] = useState<any[]>([])
  const [inventoryUsage, setInventoryUsage] = useState<any[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([])
  const [noShow, setNoShow] = useState<any>(null)

  const qs = useMemo(() => `?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`, [range])

  const loadReports = async () => {
    try {
      setLoading(true)
      const requests: Promise<any>[] = []

      requests.push(api.get(`/reports/monthly-patient-summary${qs}`))
      requests.push(api.get(`/reports/no-show-cancellation-rates${qs}`))

      if (user?.role === 'admin' || user?.role === 'doctor') {
        requests.push(api.get(`/reports/treatment-revenue${qs}`))
        requests.push(api.get(`/reports/doctor-performance${qs}`))
      } else {
        // placeholders to keep indices aligned
        requests.push(Promise.resolve({ data: { treatmentRevenue: [] } }))
        requests.push(Promise.resolve({ data: { doctorPerformance: [] } }))
      }

      if (user?.role === 'admin') {
        requests.push(api.get(`/reports/inventory-usage-expenses${qs}`))
      } else {
        requests.push(Promise.resolve({ data: { inventoryUsage: [], expensesByCategory: [] } }))
      }

      const [monthlyRes, noShowRes, treatmentRes, doctorRes, invRes] = await Promise.all(requests)

      setMonthly(monthlyRes.data?.monthlyPatientSummary || null)
      setNoShow(noShowRes.data || null)
      setTreatmentRevenue(treatmentRes.data?.treatmentRevenue || [])
      setDoctorPerformance(doctorRes.data?.doctorPerformance || [])
      setInventoryUsage(invRes.data?.inventoryUsage || [])
      setExpensesByCategory(invRes.data?.expensesByCategory || [])
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, user?.role])

  const newPatientsByMonth = monthly?.newPatientsByMonth || []
  const appointmentsByMonth = monthly?.appointmentsByMonth || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Reports</h1>
            <p className="text-secondary-600">Insights across patients, revenue, and operations</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div>
              <label className="text-xs text-secondary-600 block mb-1">Start</label>
              <input
                type="date"
                value={range.start}
                onChange={(e) => setRange((p) => ({ ...p, start: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs text-secondary-600 block mb-1">End</label>
              <input
                type="date"
                value={range.end}
                onChange={(e) => setRange((p) => ({ ...p, end: e.target.value }))}
                className="input"
              />
            </div>
            <button onClick={loadReports} disabled={loading} className="btn btn-primary btn-md self-end">
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <p className="text-sm text-secondary-600">Months (patients)</p>
            <p className="text-2xl font-bold text-secondary-900">{newPatientsByMonth.length}</p>
          </div>
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <p className="text-sm text-secondary-600">Months (appointments)</p>
            <p className="text-2xl font-bold text-secondary-900">{appointmentsByMonth.length}</p>
          </div>
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <p className="text-sm text-secondary-600">Cancelled</p>
            <p className="text-2xl font-bold text-secondary-900">{noShow?.cancelled ?? '—'}</p>
          </div>
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <p className="text-sm text-secondary-600">Cancellation/Reschedule rate</p>
            <p className="text-2xl font-bold text-secondary-900">{typeof noShow?.rate === 'number' ? `${noShow.rate}%` : '—'}</p>
          </div>
        </div>

        {/* Monthly patient & appointment summary */}
        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-secondary-900 mb-3">Monthly patient & appointment summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary-600">
                    <th className="px-3 py-2">Year</th>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">New Patients</th>
                  </tr>
                </thead>
                <tbody>
                  {newPatientsByMonth.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-secondary-500" colSpan={3}>No data</td>
                    </tr>
                  )}
                  {newPatientsByMonth.map((row: any, idx: number) => (
                    <tr key={idx} className="border-t border-secondary-200">
                      <td className="px-3 py-2">{row._id?.year}</td>
                      <td className="px-3 py-2">{row._id?.month}</td>
                      <td className="px-3 py-2 font-medium">{row.newPatients}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary-600">
                    <th className="px-3 py-2">Year</th>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Appointments</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsByMonth.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-secondary-500" colSpan={3}>No data</td>
                    </tr>
                  )}
                  {appointmentsByMonth.map((row: any, idx: number) => (
                    <tr key={idx} className="border-t border-secondary-200">
                      <td className="px-3 py-2">{row._id?.year}</td>
                      <td className="px-3 py-2">{row._id?.month}</td>
                      <td className="px-3 py-2 font-medium">{row.appointments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {(user?.role === 'admin' || user?.role === 'doctor') && (
          <>
            {/* Treatment-wise revenue */}
            <div className="bg-white border border-secondary-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-secondary-900 mb-3">Treatment-wise revenue</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-secondary-600">
                      <th className="px-3 py-2">Treatment</th>
                      <th className="px-3 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatmentRevenue.length === 0 && (
                      <tr>
                        <td className="px-3 py-4 text-secondary-500" colSpan={2}>No data</td>
                      </tr>
                    )}
                    {treatmentRevenue.map((r: any, idx: number) => (
                      <tr key={idx} className="border-t border-secondary-200">
                        <td className="px-3 py-2">{r.type}</td>
                        <td className="px-3 py-2 font-medium">₹{Number(r.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doctor performance */}
            <div className="bg-white border border-secondary-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-secondary-900 mb-3">Doctor performance</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-secondary-600">
                      <th className="px-3 py-2">Doctor ID</th>
                      <th className="px-3 py-2">Appointments</th>
                      <th className="px-3 py-2">Invoices</th>
                      <th className="px-3 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorPerformance.length === 0 && (
                      <tr>
                        <td className="px-3 py-4 text-secondary-500" colSpan={4}>No data</td>
                      </tr>
                    )}
                    {doctorPerformance.map((r: any, idx: number) => (
                      <tr key={idx} className="border-t border-secondary-200">
                        <td className="px-3 py-2">{String(r.doctor || r._id || '—')}</td>
                        <td className="px-3 py-2">{r.appointments ?? 0}</td>
                        <td className="px-3 py-2">{r.invoices ?? 0}</td>
                        <td className="px-3 py-2 font-medium">₹{Number(r.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-secondary-500 mt-2">Note: shows Doctor IDs; we can enhance to show names if you want.</p>
            </div>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            {/* Inventory usage & expenses */}
            <div className="bg-white border border-secondary-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-secondary-900 mb-3">Inventory usage & expenses</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-secondary-600">
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryUsage.length === 0 && (
                        <tr>
                          <td className="px-3 py-4 text-secondary-500" colSpan={2}>No data</td>
                        </tr>
                      )}
                      {inventoryUsage.map((r: any, idx: number) => (
                        <tr key={idx} className="border-t border-secondary-200">
                          <td className="px-3 py-2">{r.item}</td>
                          <td className="px-3 py-2 font-medium">{r.quantityUsed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-secondary-600">
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesByCategory.length === 0 && (
                        <tr>
                          <td className="px-3 py-4 text-secondary-500" colSpan={2}>No data</td>
                        </tr>
                      )}
                      {expensesByCategory.map((r: any, idx: number) => (
                        <tr key={idx} className="border-t border-secondary-200">
                          <td className="px-3 py-2">{r._id}</td>
                          <td className="px-3 py-2 font-medium">₹{Number(r.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

