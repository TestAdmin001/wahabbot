'use client'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Order {
  id: string; botId: string; customerPhone: string; total: number
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  paymentConfirmed: boolean; receiptSent: boolean; createdAt: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  delivered: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-600'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(data => { setOrders(data); setLoading(false) })
  }, [])

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders?orderId=${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as Order['status'] } : o))
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const revenue = orders.filter(o => o.paymentConfirmed).reduce((s, o) => s + o.total, 0)

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">All orders taken automatically by your AI bot</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total orders', value: orders.length },
          { label: 'Confirmed', value: orders.filter(o => o.status === 'confirmed').length },
          { label: 'Pending payment', value: orders.filter(o => !o.paymentConfirmed).length },
          { label: 'Revenue', value: `₦${revenue.toLocaleString()}` }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</div>
            <div className="text-xl font-semibold text-gray-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'confirmed', 'delivered', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <div className="font-semibold text-gray-900 mb-1">No orders yet</div>
          <p className="text-sm text-gray-500">Orders appear here when customers complete a purchase through your bot</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">+{o.customerPhone}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₦{o.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.paymentConfirmed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {o.paymentConfirmed ? '✓ Paid' : 'Awaiting'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-whatsapp"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
