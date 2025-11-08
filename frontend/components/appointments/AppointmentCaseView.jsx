"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Tabs } from "@/components/ui/Tabs" // if not exists, simple div tabs fallback
import Link from "next/link"
import toast from "react-hot-toast"

export default function AppointmentCaseView({ params }) {
  const router = useRouter()
  const { case_id } = params || {}
  const [loading, setLoading] = useState(true)
  const [caseData, setCaseData] = useState(null)
  const [activeTab, setActiveTab] = useState("chart")
  const [billItems, setBillItems] = useState([])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/appointments/case/${case_id}`)
        setCaseData(res.data)
        setLoading(false)
      } catch (err) {
        console.error("Failed to load case:", err)
        toast.error("Failed to load case")
        setLoading(false)
      }
    }
    if (case_id) fetchCase()
  }, [case_id])

  const subtotal = billItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const tax = 0
  const total = subtotal + tax

  const addBillItem = () => setBillItems([...billItems, { description: "", amount: 0 }])
  const updateBillItem = (idx, field, value) => {
    const copy = [...billItems]
    copy[idx][field] = field === "amount" ? Number(value) : value
    setBillItems(copy)
  }
  const removeBillItem = (idx) => setBillItems(billItems.filter((_, i) => i !== idx))

  const markCompleted = async () => {
    try {
      await api.patch(`/appointments/${case_id}/close`)
      toast.success("Appointment marked as completed")
      router.refresh?.()
      // refetch
      const res = await api.get(`/appointments/case/${case_id}`)
      setCaseData(res.data)
    } catch (err) {
      toast.error("Failed to mark completed")
    }
  }

  const saveBill = async () => {
    try {
      const payload = {
        items: billItems.map((i) => ({ description: i.description, amount: Number(i.amount) })),
        subtotal,
        total,
      }
      const res = await api.post(`/appointments/${case_id}/bill`, payload)
      toast.success("Bill saved")
      // attach invoice to local state
      setCaseData((prev) => ({ ...prev, invoices: [...(prev?.invoices || []), res.data] }))
    } catch (err) {
      console.error(err)
      toast.error("Failed to save bill")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner h-8 w-8"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!caseData) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-secondary-600">Case not found.</p>
        </div>
      </DashboardLayout>
    )
  }

  const appointment = caseData.appointment

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-secondary-200 shadow-sm">
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">Case ID: {appointment?.caseId}</h2>
              <p className="text-sm text-secondary-600 mt-1">
                Patient: {appointment?.patient?.name || "Unknown"}
              </p>
              <p className="text-sm text-secondary-600">
                Date: {formatDate(appointment?.date)} | Status: {appointment?.status}
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link href="/dashboard" className="px-3 py-2 rounded bg-secondary-100 text-secondary-900 hover:bg-secondary-200">Back to Dashboard</Link>
              <button onClick={markCompleted} className="px-3 py-2 rounded bg-success-600 text-white hover:bg-success-700">Mark as Completed</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-secondary-200 shadow-sm">
          <div className="p-4 border-b border-secondary-200">
            <div className="flex gap-4">
              {[
                { key: "chart", label: "Dental Chart" },
                { key: "prescription", label: "Prescription" },
                { key: "treatments", label: "Treatments" },
                { key: "billing", label: "Generate Bill" },
                { key: "notes", label: "Notes" },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`px-3 py-2 rounded ${activeTab === t.key ? "bg-primary-600 text-white" : "bg-secondary-100 text-secondary-800"}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Panels */}
          <div className="p-4">
            {activeTab === "chart" && (
              <div className="space-y-3">
                <p className="text-secondary-700">Open and update the patient’s dental chart.</p>
                <Link
                  href={`/patients/${appointment?.patient?._id}/dental-chart`}
                  className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 inline-block"
                >
                  Go to Dental Chart
                </Link>
              </div>
            )}

            {activeTab === "prescription" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Prescriptions</h4>
                  <Link href="/prescriptions/create" className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">New Prescription</Link>
                </div>
                <div className="space-y-2">
                  {(caseData.prescriptions || []).map((p) => (
                    <div key={p._id} className="flex items-center justify-between p-3 bg-secondary-50 rounded">
                      <div>
                        <p className="text-sm font-medium">Diagnosis: {p.diagnosis || '-'}</p>
                        <p className="text-xs text-secondary-600">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Link href={`/prescriptions/${p._id}`} className="px-3 py-1 rounded bg-secondary-200 text-secondary-900">View</Link>
                    </div>
                  ))}
                  {(!caseData.prescriptions || caseData.prescriptions.length === 0) && (
                    <p className="text-secondary-600">No prescriptions yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "treatments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Treatment Plans</h4>
                  <Link href="/treatments" className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">Manage Treatments</Link>
                </div>
                <div className="space-y-2">
                  {(caseData.treatmentPlans || []).map((t) => (
                    <div key={t._id} className="p-3 bg-secondary-50 rounded">
                      <p className="text-sm font-medium">{t.status} • Estimated: ₹{t.totalCost || 0}</p>
                      <p className="text-xs text-secondary-600">Start: {t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'}</p>
                    </div>
                  ))}
                  {(!caseData.treatmentPlans || caseData.treatmentPlans.length === 0) && (
                    <p className="text-secondary-600">No treatment plans yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Generate Bill</h4>
                  <button onClick={addBillItem} className="px-3 py-2 rounded bg-secondary-100 text-secondary-900">Add Charge</button>
                </div>
                <div className="space-y-3">
                  {billItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateBillItem(idx, "description", e.target.value)}
                        className="col-span-8 input"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateBillItem(idx, "amount", e.target.value)}
                        className="col-span-3 input"
                        placeholder="Amount"
                        min={0}
                      />
                      <button onClick={() => removeBillItem(idx)} className="col-span-1 px-3 py-2 rounded bg-error-100 text-error-800">X</button>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm">Subtotal: ₹{subtotal.toFixed(2)}</p>
                  <p className="text-sm">Tax: ₹{tax.toFixed(2)}</p>
                  <p className="text-sm font-semibold">Total: ₹{total.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveBill} className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">Save Bill</button>
                  <button
                    onClick={async () => {
                      try {
                        const lastInvoice = (caseData.invoices || []).slice(-1)[0]
                        if (!lastInvoice?._id) {
                          toast.error("No invoice to print. Save bill first.")
                          return
                        }
                        await api.get(`/invoices/${lastInvoice._id}/generate-pdf`)
                        toast.success("PDF generated")
                      } catch (err) {
                        toast.error("Failed to generate PDF")
                      }
                    }}
                    className="px-3 py-2 rounded bg-secondary-100 text-secondary-900 hover:bg-secondary-200"
                  >
                    Print / Generate PDF
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input w-full min-h-[120px]"
                  placeholder="Doctor's notes"
                />
                <p className="text-xs text-secondary-500">Notes are local-only for now. Persisting can be added.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}