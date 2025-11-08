'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { IndianRupee, FileText, BadgeCheck } from 'lucide-react'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  lineTotal?: number
}

interface Payment {
  amount: number
  method: string
  date: string
  notes?: string
}

interface Invoice {
  _id: string
  patient?: { name: string } | null
  doctor?: { name: string } | null
  status: string
  total: number
  subtotal?: number
  gstAmount?: number
  discountAmount?: number
  createdAt?: string
  items?: InvoiceItem[]
  payments?: Payment[]
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const res = await api.get(`/invoices${params}`)
      setInvoices(res.data.invoices || res.data || [])
    } catch (err) {
      console.error('Failed to load invoices', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Invoices</h1>
            <p className="text-secondary-600">Manage billing and payments</p>
          </div>
        </div>

        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-secondary-600">Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-secondary-300 rounded-md px-2 py-1 text-sm"
              >
                <option value="">All</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary-600">
                    <th className="px-3 py-2">Invoice</th>
                    <th className="px-3 py-2">Patient</th>
                    <th className="px-3 py-2">Doctor</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-secondary-500" colSpan={7}>
                        No invoices found
                      </td>
                    </tr>
                  )}
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="border-t border-secondary-200">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-secondary-500" />
                          <span className="font-medium">{inv._id.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{inv.patient?.name || '—'}</td>
                      <td className="px-3 py-2">{inv.doctor?.name || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${inv.status === 'paid' ? 'bg-success-100 text-success-700' : inv.status === 'partial' ? 'bg-warning-100 text-warning-700' : 'bg-error-100 text-error-700'}`}>{inv.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-secondary-500" />
                          <span className="font-semibold">{inv.total?.toFixed(2) ?? '0.00'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => router.push(`/invoices/${inv._id}`)}
                          className="text-primary-700 hover:underline text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}