'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Receipt, IndianRupee, CalendarDays, PlusCircle } from 'lucide-react'

interface Expense {
  _id: string
  category: string
  amount: number
  date: string
  notes?: string
  vendor?: { name: string } | string | null
}

interface MonthlySummaryItem {
  month: number
  totalExpenses: number
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ category: '', amount: 0, date: new Date().toISOString().slice(0,10), notes: '' })
  const [summary, setSummary] = useState<MonthlySummaryItem[]>([])

  useEffect(() => {
    fetchExpenses()
    fetchSummary()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/expenses')
      setExpenses(res.data.expenses || res.data || [])
    } catch (err) {
      console.error('Failed to load expenses', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const year = new Date().getFullYear()
      const res = await api.get(`/expenses/summary/monthly?year=${year}`)
      setSummary(res.data.summary || [])
    } catch (err) {
      console.error('Failed to load monthly summary', err)
    }
  }

  const addExpense = async () => {
    try {
      if (!newExpense.category || !newExpense.amount) return
      await api.post('/expenses', newExpense)
      setShowAdd(false)
      setNewExpense({ category: '', amount: 0, date: new Date().toISOString().slice(0,10), notes: '' })
      await fetchExpenses()
      await fetchSummary()
    } catch (err) {
      console.error('Failed to add expense', err)
    }
  }

  const monthName = (m: number) => new Date(2020, m - 1, 1).toLocaleString(undefined, { month: 'short' })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Expenses</h1>
            <p className="text-secondary-600">Track clinic operating expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 text-white rounded px-3 py-2 text-sm hover:bg-primary-700"><PlusCircle className="h-4 w-4" /> Add Expense</button>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-secondary-900 mb-3">Monthly Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(summary || []).map((s) => (
              <div key={s.month} className="p-3 bg-secondary-50 rounded border border-secondary-200">
                <p className="text-xs text-secondary-600">{monthName(s.month)}</p>
                <p className="text-base font-semibold text-secondary-900 flex items-center gap-1"><IndianRupee className="h-4 w-4" /> {s.totalExpenses?.toFixed(2)}</p>
              </div>
            ))}
            {(!summary || summary.length === 0) && (
              <p className="text-secondary-500">No summary available</p>
            )}
          </div>
        </div>

        {/* Add Expense */}
        {showAdd && (
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-3">New Expense</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={newExpense.category as string} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} placeholder="Category" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input type="number" value={newExpense.amount as number} onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })} placeholder="Amount" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input type="date" value={newExpense.date as string} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input value={newExpense.notes as string} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} placeholder="Notes (optional)" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={addExpense} className="bg-primary-600 text-white rounded px-3 py-2 text-sm hover:bg-primary-700">Save</button>
              <button onClick={() => setShowAdd(false)} className="border border-secondary-300 rounded px-3 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Expense List */}
        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary-600">
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-secondary-500" colSpan={4}>No expenses found</td>
                    </tr>
                  )}
                  {expenses.map((ex) => (
                    <tr key={ex._id} className="border-t border-secondary-200">
                      <td className="px-3 py-2">{ex.category}</td>
                      <td className="px-3 py-2">₹{ex.amount?.toFixed(2)}</td>
                      <td className="px-3 py-2">{new Date(ex.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{ex.notes || '—'}</td>
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