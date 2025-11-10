"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import toast from "react-hot-toast"

export default function AppointmentCaseView({ params }) {
  const router = useRouter()
  const { case_id } = params || {}
  const [loading, setLoading] = useState(true)
  const [caseData, setCaseData] = useState(null)
  const [activeTab, setActiveTab] = useState("chart")
  const createEmptyBillItem = () => ({
    description: "",
    quantity: 1,
    unitPrice: 0
  })
  const [billItems, setBillItems] = useState([createEmptyBillItem()])
  const [gstPercent, setGstPercent] = useState(0)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [billNotes, setBillNotes] = useState("")
  const [caseNotes, setCaseNotes] = useState("")

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/appointments/case/${case_id}`)
        const payload = res.data
        setCaseData(payload)

        const invoices = payload?.invoices || []
        const latestInvoice = invoices.length ? invoices[invoices.length - 1] : null

        if (latestInvoice?.items?.length) {
          setBillItems(
            latestInvoice.items.map((item) => ({
              description: item.description || "",
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice ?? 0
            }))
          )
          setGstPercent(latestInvoice.gstPercent || 0)
          setDiscountPercent(latestInvoice.discountPercent || 0)
          setBillNotes(latestInvoice.notes || "")
        } else {
          setBillItems([createEmptyBillItem()])
          setGstPercent(0)
          setDiscountPercent(0)
          setBillNotes("")
        }
        setLoading(false)
      } catch (err) {
        console.error("Failed to load case:", err)
        toast.error("Failed to load case")
        setLoading(false)
      }
    }
    if (case_id) fetchCase()
  }, [case_id])

  const subtotal = billItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    return sum + qty * price
  }, 0)
  const gstAmount = subtotal * ((Number(gstPercent) || 0) / 100)
  const discountAmount = subtotal * ((Number(discountPercent) || 0) / 100)
  const total = Math.max(0, subtotal + gstAmount - discountAmount)

  const addBillItem = () => setBillItems([...billItems, createEmptyBillItem()])
  const updateBillItem = (idx, field, value) => {
    const copy = [...billItems]
    if (field === "quantity" || field === "unitPrice") {
      copy[idx][field] = Number(value)
    } else {
      copy[idx][field] = value
    }
    setBillItems(copy)
  }
  const removeBillItem = (idx) => {
    const remaining = billItems.filter((_, i) => i !== idx)
    setBillItems(remaining.length ? remaining : [createEmptyBillItem()])
  }

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
      const preparedItems = billItems
        .filter((item) => item.description && Number(item.quantity) > 0)
        .map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0
        }))

      if (!preparedItems.length) {
        toast.error("Add at least one billed item before saving")
        return
      }

      const payload = {
        items: preparedItems,
        gstPercent: Number(gstPercent) || 0,
        discountPercent: Number(discountPercent) || 0,
        notes: billNotes
      }
      const res = await api.post(`/appointments/${case_id}/bill`, payload)
      const invoice = res.data?.invoice
      toast.success("Bill saved")
      if (invoice) {
        setCaseData((prev) => {
          if (!prev) return prev
          const existing = prev.invoices || []
          const filtered = existing.filter((inv) => inv._id !== invoice._id)
          return {
            ...prev,
            invoices: [...filtered, invoice]
          }
        })
        setBillItems(
          (invoice.items || []).map((item) => ({
            description: item.description || "",
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0
          }))
        )
        setGstPercent(invoice.gstPercent || 0)
        setDiscountPercent(invoice.discountPercent || 0)
        setBillNotes(invoice.notes || "")
      }
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Failed to save bill")
    }
  }
  const handleCreatePrescription = () => {
    const patientId = caseData?.appointment?.patient?._id
    if (!patientId) {
      toast.error("Patient not available for this case")
      return
    }
    const params = new URLSearchParams({ patientId })
    if (caseData?.appointment?.caseId) params.set("caseId", caseData.appointment.caseId)
    if (caseData?.appointment?._id) params.set("appointmentId", caseData.appointment._id)
    router.push(`/prescriptions/create?${params.toString()}`)
  }

  const handleCreateTreatmentPlan = () => {
    const patientId = caseData?.appointment?.patient?._id
    if (!patientId) {
      toast.error("Patient not available for this case")
      return
    }
    const params = new URLSearchParams({ patientId })
    if (caseData?.appointment?.doctor?._id) params.set("doctorId", caseData.appointment.doctor._id)
    if (caseData?.appointment?.caseId) params.set("caseId", caseData.appointment.caseId)
    router.push(`/treatment-plans/create?${params.toString()}`)
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="font-semibold">Prescriptions</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCreatePrescription}
                      className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700"
                    >
                      Create Prescription
                    </button>
                    <Link
                      href={`/prescriptions?patient=${caseData?.appointment?.patient?._id ?? ""}`}
                      className="px-3 py-2 rounded bg-secondary-100 text-secondary-900 hover:bg-secondary-200"
                    >
                      View Prescriptions
                    </Link>
                  </div>
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="font-semibold">Treatment Plans</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCreateTreatmentPlan}
                      className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700"
                    >
                      Create Treatment Plan
                    </button>
                    <Link
                      href={`/treatment-plans?patient=${caseData?.appointment?.patient?._id ?? ""}`}
                      className="px-3 py-2 rounded bg-secondary-100 text-secondary-900 hover:bg-secondary-200"
                    >
                      View Treatment Plans
                    </Link>
                  </div>
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
                  <button onClick={addBillItem} className="px-3 py-2 rounded bg-secondary-100 text-secondary-900">
                    Add Charge
                  </button>
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
                        value={item.quantity}
                        onChange={(e) => updateBillItem(idx, "quantity", e.target.value)}
                        className="col-span-2 input"
                        placeholder="Qty"
                        min={1}
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateBillItem(idx, "unitPrice", e.target.value)}
                        className="col-span-2 input"
                        placeholder="Unit Price"
                        min={0}
                      />
                      <button onClick={() => removeBillItem(idx)} className="col-span-1 px-3 py-2 rounded bg-error-100 text-error-800">
                        X
                      </button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-secondary-600 block mb-1">GST (%)</label>
                    <input
                      type="number"
                      value={gstPercent}
                      min={0}
                      onChange={(e) => setGstPercent(Number(e.target.value))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-600 block mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={discountPercent}
                      min={0}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="input"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-secondary-600 block mb-1">Billing Notes</label>
                    <textarea
                      value={billNotes}
                      onChange={(e) => setBillNotes(e.target.value)}
                      className="input min-h-[80px]"
                      placeholder="Add billing notes (optional)"
                    />
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm">Subtotal: ₹{subtotal.toFixed(2)}</p>
                  <p className="text-sm">GST: ₹{gstAmount.toFixed(2)}</p>
                  <p className="text-sm">Discount: ₹{discountAmount.toFixed(2)}</p>
                  <p className="text-sm font-semibold">Total: ₹{total.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveBill} className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">
                    Save Bill
                  </button>
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
                <div className="border-t pt-4 space-y-3">
                  <h5 className="font-semibold text-sm text-secondary-800">Invoice History</h5>
                  {(caseData.invoices || []).length ? (
                    <div className="space-y-3">
                      {[...caseData.invoices]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((invoice) => (
                          <div key={invoice._id} className="rounded border border-secondary-200 p-3 bg-secondary-50">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-secondary-900">
                                  Invoice #{invoice._id.slice(-6).toUpperCase()}
                                </p>
                                <p className="text-xs text-secondary-600">
                                  Issued {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : "-"} • Total ₹
                                  {invoice.total?.toFixed(2) ?? "0.00"}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs rounded-full bg-secondary-200 px-2 py-1">
                                  {invoice.status || "Pending"}
                                </span>
                                <Link
                                  href={`/invoices/${invoice._id}`}
                                  className="text-xs px-3 py-1 rounded bg-secondary-100 text-secondary-900 hover:bg-secondary-200"
                                >
                                  View Invoice
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-secondary-500">No invoices generated yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-3">
                <textarea
                  value={caseNotes}
                  onChange={(e) => setCaseNotes(e.target.value)}
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