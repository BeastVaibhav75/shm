'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { IndianRupee, FileText, CreditCard, ArrowLeft } from 'lucide-react'

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

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [payAmount, setPayAmount] = useState<string>('')
  const [payMethod, setPayMethod] = useState<string>('cash')
  const [payNotes, setPayNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (id) {
      fetchInvoice()
    }
  }, [id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/invoices/${id}`)
      setInvoice(res.data.invoice || res.data)
    } catch (err) {
      console.error('Failed to load invoice', err)
    } finally {
      setLoading(false)
    }
  }

  const addPayment = async () => {
    try {
      setSubmitting(true)
      const amount = parseFloat(payAmount)
      if (!amount || amount <= 0) return
      await api.post(`/invoices/${id}/payments`, {
        amount,
        method: payMethod,
        notes: payNotes,
      })
      setPayAmount('')
      setPayNotes('')
      await fetchInvoice()
    } catch (err) {
      console.error('Failed to add payment', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/invoices')} className="text-secondary-600 hover:text-secondary-900 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2"><FileText className="h-5 w-5" /> Invoice #{id?.slice(-6)}</h1>
            <p className="text-secondary-600">Status: <span className="font-medium">{invoice?.status || '—'}</span></p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner h-8 w-8" />
          </div>
        ) : invoice ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary */}
            <div className="lg:col-span-2 bg-white border border-secondary-200 rounded-lg p-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary-600">Patient</p>
                  <p className="font-medium">{invoice.patient?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Doctor</p>
                  <p className="font-medium">{invoice.doctor?.name || '—'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-secondary-600">
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Unit Price</th>
                        <th className="px-3 py-2">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoice.items || []).map((it, idx) => (
                        <tr key={idx} className="border-t border-secondary-200">
                          <td className="px-3 py-2">{it.description}</td>
                          <td className="px-3 py-2">{it.quantity}</td>
                          <td className="px-3 py-2">₹{it.unitPrice?.toFixed(2)}</td>
                          <td className="px-3 py-2">₹{(it.lineTotal ?? it.quantity * it.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-col items-end">
                  <div className="w-full sm:w-1/2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-600">Subtotal</span>
                      <span className="font-medium">₹{invoice.subtotal?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-600">GST</span>
                      <span className="font-medium">₹{invoice.gstAmount?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-600">Discount</span>
                      <span className="font-medium">₹{invoice.discountAmount?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-base mt-2">
                      <span className="text-secondary-800 font-semibold">Total</span>
                      <span className="font-bold flex items-center gap-1"><IndianRupee className="h-4 w-4" /> {invoice.total?.toFixed(2) ?? '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white border border-secondary-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payments</h3>
              <div className="space-y-2">
                {(invoice.payments || []).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-secondary-50 rounded p-2 text-sm">
                    <span>₹{p.amount?.toFixed(2)} via {p.method}</span>
                    <span className="text-secondary-600">{new Date(p.date).toLocaleDateString()}</span>
                  </div>
                ))}
                {(!invoice.payments || invoice.payments.length === 0) && (
                  <p className="text-secondary-500">No payments recorded</p>
                )}
              </div>

              <div className="mt-4 border-t border-secondary-200 pt-4">
                <h4 className="text-sm font-semibold text-secondary-900 mb-2">Add Payment</h4>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full border border-secondary-300 rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full border border-secondary-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full border border-secondary-300 rounded px-3 py-2 text-sm"
                  />
                  <button
                    disabled={submitting}
                    onClick={addPayment}
                    className="w-full bg-primary-600 text-white rounded px-3 py-2 hover:bg-primary-700 text-sm"
                  >
                    {submitting ? 'Processing...' : 'Add Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-secondary-200 rounded-lg p-6">
            <p className="text-secondary-600">Invoice not found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}