'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

type InvoiceItemForm = {
  description: string
  quantity: number
  unitPrice: number
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetPatientId = searchParams.get('patientId') || ''

  const [patients, setPatients] = useState<any[]>([])
  const [patientId, setPatientId] = useState(presetPatientId)
  const [items, setItems] = useState<InvoiceItemForm[]>([
    { description: '', quantity: 1, unitPrice: 0 }
  ])
  const [gstPercent, setGstPercent] = useState<number>(0)
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [dueDate, setDueDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        const res = await api.get('/patients?limit=200')
        let data = Array.isArray(res.data) ? res.data : res.data?.patients || []

        if (presetPatientId && !data.some((p: any) => p._id === presetPatientId)) {
          try {
            const pr = await api.get(`/patients/${presetPatientId}`)
            const p = pr.data?.patient || pr.data
            if (p) data = [...data, p]
          } catch {
            // ignore; just leave dropdown without preset patient
          }
        }

        setPatients(data)
      } catch (err) {
        console.error('Failed to load patients', err)
        toast.error('Failed to load patients')
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [presetPatientId])

  const subtotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const qty = Number(it.quantity) || 0
        const price = Number(it.unitPrice) || 0
        return sum + qty * price
      }, 0),
    [items]
  )

  const estimatedGst = useMemo(
    () => subtotal * ((Number(gstPercent) || 0) / 100),
    [subtotal, gstPercent]
  )

  const estimatedDiscount = useMemo(
    () => subtotal * ((Number(discountPercent) || 0) / 100),
    [subtotal, discountPercent]
  )

  const estimatedTotal = useMemo(
    () => Math.max(0, subtotal + estimatedGst - estimatedDiscount),
    [subtotal, estimatedGst, estimatedDiscount]
  )

  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (idx: number) => setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
  const updateItem = (idx: number, key: keyof InvoiceItemForm, value: any) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [key]: key === 'description' ? String(value) : Number(value) }
      return copy
    })
  }

  const handleSubmit = async () => {
    try {
      if (!patientId) {
        toast.error('Please select a patient')
        return
      }

      const cleanedItems = items
        .map((it) => ({
          description: (it.description || '').trim(),
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0
        }))
        .filter((it) => it.description && it.quantity > 0)

      if (!cleanedItems.length) {
        toast.error('Add at least one item')
        return
      }

      setSubmitting(true)
      const payload: any = {
        patient: patientId,
        items: cleanedItems,
        gstPercent: Number(gstPercent) || 0,
        discountPercent: Number(discountPercent) || 0,
        notes: notes || ''
      }
      if (dueDate) payload.dueDate = dueDate

      const res = await api.post('/invoices', payload)
      const invoice = res.data?.invoice || res.data
      toast.success('Invoice created')
      if (invoice?._id) router.push(`/invoices/${invoice._id}`)
      else router.push('/invoices')
    } catch (err: any) {
      console.error('Failed to create invoice', err)
      toast.error(err?.response?.data?.message || 'Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/invoices')}
            className="text-secondary-600 hover:text-secondary-900 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-secondary-900">Create Invoice</h1>
            <p className="text-secondary-600">Manual billing entry</p>
          </div>
        </div>

        <div className="bg-white border border-secondary-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Patient *</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="input w-full"
                disabled={loading}
              >
                <option value="">{loading ? 'Loading...' : 'Select patient'}</option>
                {patients.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.contact ? `(${p.contact})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-secondary-900">Items *</h2>
              <button onClick={addItem} className="btn btn-outline btn-sm flex items-center gap-2" type="button">
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-secondary-50 border border-secondary-200 rounded-lg p-3">
                  <div className="md:col-span-6">
                    <label className="label">Description</label>
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="input w-full"
                      placeholder="e.g., Consultation / Filling"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="label">Unit Price</label>
                    <input
                      type="number"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      className="p-2 rounded-md hover:bg-secondary-200 text-secondary-700"
                      onClick={() => removeItem(idx)}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">GST %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Discount %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input w-full min-h-[90px] resize-none"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-secondary-200 pt-4">
            <div className="text-sm text-secondary-700 space-y-1">
              <div className="flex items-center justify-between md:justify-start md:gap-4">
                <span className="text-secondary-500">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:gap-4">
                <span className="text-secondary-500">GST (est.)</span>
                <span className="font-medium">₹{estimatedGst.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:gap-4">
                <span className="text-secondary-500">Discount (est.)</span>
                <span className="font-medium">₹{estimatedDiscount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:gap-4 pt-1">
                <span className="text-secondary-800 font-semibold">Total (est.)</span>
                <span className="font-bold">₹{estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="btn btn-primary btn-md"
              type="button"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

