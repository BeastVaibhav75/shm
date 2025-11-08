'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Package, AlertTriangle, PlusCircle, MinusCircle } from 'lucide-react'

interface InventoryItem {
  _id: string
  name: string
  sku?: string
  quantity: number
  unit?: string
  reorderLevel?: number
  vendor?: { name: string } | string | null
  cost?: number
}

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ name: '', sku: '', unit: '', reorderLevel: 0, cost: 0, quantity: 0 })

  const [deductItemId, setDeductItemId] = useState<string>('')
  const [deductQty, setDeductQty] = useState<string>('')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await api.get('/inventory/items')
      setItems(res.data.items || res.data || [])
    } catch (err) {
      console.error('Failed to load inventory items', err)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    try {
      if (!newItem.name) return
      await api.post('/inventory/items', newItem)
      setShowAdd(false)
      setNewItem({ name: '', sku: '', unit: '', reorderLevel: 0, cost: 0, quantity: 0 })
      await fetchItems()
    } catch (err) {
      console.error('Failed to add item', err)
    }
  }

  const deductStock = async () => {
    try {
      if (!deductItemId) return
      const qty = parseInt(deductQty)
      if (!qty || qty <= 0) return
      await api.post(`/inventory/items/${deductItemId}/deduct`, { quantity: qty })
      setDeductItemId('')
      setDeductQty('')
      await fetchItems()
    } catch (err) {
      console.error('Failed to deduct stock', err)
    }
  }

  const isLowStock = (item: InventoryItem) => {
    if (item.reorderLevel == null) return false
    return item.quantity <= item.reorderLevel
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Inventory</h1>
            <p className="text-secondary-600">Manage clinic consumables and stock levels</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/inventory/vendors')} className="text-primary-700 hover:underline">Manage Vendors</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 text-white rounded px-3 py-2 text-sm hover:bg-primary-700"><PlusCircle className="h-4 w-4" /> Add Item</button>
          </div>
        </div>

        {/* Add Item Modal */}
        {showAdd && (
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-3">New Item</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={newItem.name as string} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Name" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input value={newItem.sku as string} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} placeholder="SKU" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input value={newItem.unit as string} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} placeholder="Unit (e.g., ml, pcs)" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input type="number" value={newItem.reorderLevel as number} onChange={(e) => setNewItem({ ...newItem, reorderLevel: parseInt(e.target.value) || 0 })} placeholder="Reorder Level" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input type="number" value={newItem.cost as number} onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })} placeholder="Cost" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
              <input type="number" value={newItem.quantity as number} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })} placeholder="Initial Quantity" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={addItem} className="bg-primary-600 text-white rounded px-3 py-2 text-sm hover:bg-primary-700">Save</button>
              <button onClick={() => setShowAdd(false)} className="border border-secondary-300 rounded px-3 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary-600">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Quantity</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Reorder</th>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-secondary-500" colSpan={7}>No items found</td>
                  </tr>
                )}
                {items.map((it) => (
                  <tr key={it._id} className="border-t border-secondary-200">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-secondary-500" />
                        <span className="font-medium">{it.name}</span>
                        {isLowStock(it) && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-warning-100 text-warning-800 rounded"><AlertTriangle className="h-3 w-3" /> Low</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">{it.sku || '—'}</td>
                    <td className="px-3 py-2">{it.quantity}</td>
                    <td className="px-3 py-2">{it.unit || '—'}</td>
                    <td className="px-3 py-2">{it.reorderLevel ?? '—'}</td>
                    <td className="px-3 py-2">{typeof it.vendor === 'string' ? it.vendor : it.vendor?.name || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setDeductItemId(it._id); }} className="flex items-center gap-1 text-warning-700 hover:underline text-sm"><MinusCircle className="h-4 w-4" /> Deduct</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deduct Stock Controls */}
          {deductItemId && (
            <div className="mt-4 border-t border-secondary-200 pt-4">
              <h4 className="text-sm font-semibold text-secondary-900 mb-2">Deduct Stock</h4>
              <div className="flex items-center gap-2">
                <input type="number" value={deductQty} onChange={(e) => setDeductQty(e.target.value)} placeholder="Quantity" className="border border-secondary-300 rounded px-3 py-2 text-sm" />
                <button onClick={deductStock} className="bg-warning-600 text-white rounded px-3 py-2 text-sm hover:bg-warning-700">Deduct</button>
                <button onClick={() => { setDeductItemId(''); setDeductQty(''); }} className="border border-secondary-300 rounded px-3 py-2 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}