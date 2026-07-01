'use client'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Customer {
  id: string; phone: string; name?: string
  totalOrders: number; totalSpent: number; lastSeen: string; createdAt: string; tags: string[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(data => { setCustomers(data); setLoading(false) })
  }, [])

  const filtered = customers.filter(c =>
    c.phone.includes(search) || c.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)
  const totalOrders = customers.reduce((s, c) => s + c.totalOrders, 0)

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Auto-built from every WhatsApp conversation — no manual entry needed</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total customers', value: customers.length },
          { label: 'Total orders', value: totalOrders },
          { label: 'Total revenue', value: `₦${totalSpent.toLocaleString()}` }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by phone or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <div className="font-semibold text-gray-900 mb-1">No customers yet</div>
          <p className="text-sm text-gray-500">Customers are automatically added when they message your WhatsApp bot</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total spent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Last seen</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-medium text-xs flex-shrink-0">
                        {c.phone.slice(-2)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.name || `+${c.phone}`}</div>
                        {c.name && <div className="text-xs text-gray-400">+{c.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.totalOrders}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">₦{c.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDistanceToNow(new Date(c.lastSeen), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('en-NG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
