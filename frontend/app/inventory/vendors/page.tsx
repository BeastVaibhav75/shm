'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Store, PlusCircle } from 'lucide-react'

interface Vendor {
  _id: string
  name: string
  contact?: string
  phone?: string
  email?: string
  address?: string
}

export default function VendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({ name: '', contact: '', phone: '', email: '', address: '' })

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const res = await api.get('/inventory/vendors')
      setVendors(res.data.vendors || res.data || [])
    } catch (err) {
      console.error('Failed to load vendors', err)
    } finally {
      setLoading(false)
    }
  }

  const addVendor = async () => {
    try {
      if (!newVendor.name) return
      await api.post('/inventory/vendors', newVendor)
      setShowAdd(false)
      setNewVendor({ name: '', contact: '', phone: '', email: '', address: '' })
      await fetchVendors()
    } catch (err) {
      console.error('Failed to add vendor', err)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Vendors</h1>
            <p className="text-secondary-600">Manage suppliers for inventory items</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/inventory')} className="text-secondary-700 hover:underline">Back to Inventory</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 text-white rounded px-3 py-2 text-sm hover:bg-primary-700"><PlusCircle className="h-4 w-4" /> Add Vendor</button>
          </div>
        </div>

        {/* Add Vendor */}
        {showAdd && (
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-3">New Vendor</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={newVendor.name as string} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} placeholder="Name" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input value={newVendor.contact as string} onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })} placeholder="Contact Person" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input value={newVendor.phone as string} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} placeholder="Phone" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input value={newVendor.email as string} onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })} placeholder="Email" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input value={newVendor.address as string} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} placeholder="Address" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={addVendor} className="bg-primary-600 text-white rounded px-3 py-2 text-sm hover:bg-primary-700">Save</button>
              <button onClick={() => setShowAdd(false)} className="border border-secondary-300 rounded px-3 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}

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
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Contact</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-secondary-500" colSpan={5}>No vendors found</td>
                    </tr>
                  )}
                  {vendors.map((v) => (
                    <tr key={v._id} className="border-t border-secondary-200">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-secondary-500" />
                          <span className="font-medium">{v.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{v.contact || '—'}</td>
                      <td className="px-3 py-2">{v.phone || '—'}</td>
                      <td className="px-3 py-2">{v.email || '—'}</td>
                      <td className="px-3 py-2">{v.address || '—'}</td>
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