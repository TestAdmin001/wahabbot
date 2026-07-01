'use client'
import { useState, useEffect } from 'react'

interface AnalyticsStat {
  botId: string; botName: string; conversations: number; messages: number
  customers: number; orders: number; revenue: number; conversionRate: number
  avgOrderValue: number; hourCounts: Record<number, number>; topWords: string[]
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(data => { setStats(data); setLoading(false) })
  }, [])

  const totals = stats.reduce((acc, s) => ({
    conversations: acc.conversations + s.conversations,
    messages: acc.messages + s.messages,
    customers: acc.customers + s.customers,
    orders: acc.orders + s.orders,
    revenue: acc.revenue + s.revenue
  }), { conversations: 0, messages: 0, customers: 0, orders: 0, revenue: 0 })

  const allHours = stats.reduce((acc, s) => {
    Object.entries(s.hourCounts).forEach(([h, c]) => {
      acc[+h] = (acc[+h] || 0) + c
    })
    return acc
  }, {} as Record<number, number>)

  const maxHourCount = Math.max(...Object.values(allHours), 1)
  const peakHour = Object.entries(allHours).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Understand how your AI bot is performing</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading analytics...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Conversations', value: totals.conversations },
              { label: 'AI messages sent', value: totals.messages },
              { label: 'Customers', value: totals.customers },
              { label: 'Orders taken', value: totals.orders },
              { label: 'Revenue confirmed', value: `₦${totals.revenue.toLocaleString()}` }
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</div>
                <div className="text-xl font-semibold text-gray-900 mt-1">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Peak hours chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <div className="text-sm font-semibold text-gray-900 mb-1">Peak chat hours</div>
            <div className="text-xs text-gray-400 mb-5">
              {peakHour ? `Most active: ${+peakHour[0] < 12 ? `${peakHour[0]}am` : `${+peakHour[0] - 12 || 12}pm`}` : 'No data yet'}
            </div>
            <div className="flex items-end gap-1 h-28">
              {Array.from({ length: 24 }, (_, h) => {
                const count = allHours[h] || 0
                const height = maxHourCount > 0 ? Math.round((count / maxHourCount) * 100) : 0
                const isPeak = count === maxHourCount && count > 0
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm transition-all" style={{ height: `${Math.max(height, 2)}%`, background: isPeak ? '#25D366' : '#e5e7eb' }} title={`${h}:00 — ${count} messages`} />
                    {h % 6 === 0 && <span className="text-[9px] text-gray-400">{h}h</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per-bot stats */}
          {stats.length > 1 && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-900 mb-3">Per bot breakdown</div>
              <div className="space-y-3">
                {stats.map(s => (
                  <div key={s.botId} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-gray-900">{s.botName}</div>
                      <div className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">{s.conversionRate}% conversion</div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { l: 'Conversations', v: s.conversations },
                        { l: 'Customers', v: s.customers },
                        { l: 'Orders', v: s.orders },
                        { l: 'Revenue', v: `₦${s.revenue.toLocaleString()}` }
                      ].map(m => (
                        <div key={m.l}>
                          <div className="text-xs text-gray-400">{m.l}</div>
                          <div className="text-sm font-semibold text-gray-900 mt-0.5">{m.v}</div>
                        </div>
                      ))}
                    </div>
                    {s.topWords.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <div className="text-xs text-gray-400 mb-1.5">Top keywords from customers</div>
                        <div className="flex flex-wrap gap-1.5">
                          {s.topWords.map(w => (
                            <span key={w} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              No data yet — analytics appear once customers start messaging your bot
            </div>
          )}
        </>
      )}
    </div>
  )
}
