'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useBusiness } from './context'

interface Bot { id: string; name: string; isActive: boolean; tone: string; updatedAt: string }
interface Stats { conversations: number; messages: number }

export default function DashboardPage() {
  const business = useBusiness()
  const [bots, setBots] = useState<Bot[]>([])
  const [stats, setStats] = useState<Record<string, Stats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bots')
      .then(r => r.json())
      .then(async (data: Bot[]) => {
        setBots(data)
        // Fetch stats for each bot
        const statsMap: Record<string, Stats> = {}
        await Promise.all(data.map(async (bot) => {
          const r = await fetch(`/api/bots/${bot.id}`)
          const d = await r.json()
          statsMap[bot.id] = d.stats || { conversations: 0, messages: 0 }
        }))
        setStats(statsMap)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalConvs = Object.values(stats).reduce((s, v) => s + v.conversations, 0)
  const totalMsgs = Object.values(stats).reduce((s, v) => s + v.messages, 0)
  const activeBots = bots.filter(b => b.isActive).length

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">Good day, {business?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your AI assistants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active bots', value: activeBots, sub: `${bots.length} total` },
          { label: 'Conversations', value: totalConvs, sub: 'all time' },
          { label: 'Messages sent', value: totalMsgs, sub: 'by AI' },
          { label: 'Response rate', value: '100%', sub: 'always on' }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bots */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Your bots</h2>
        <Link href="/dashboard/bots/new" className="btn-primary text-xs px-3 py-1.5">+ New bot</Link>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
      ) : bots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 border-dashed p-12 text-center">
          <div className="text-4xl mb-3">🤖</div>
          <div className="font-semibold text-gray-900 mb-1">No bots yet</div>
          <p className="text-sm text-gray-500 mb-4">Create your first AI WhatsApp assistant</p>
          <Link href="/dashboard/bots/new" className="btn-primary">Create your first bot</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {bots.map(bot => (
            <Link key={bot.id} href={`/dashboard/bots/${bot.id}`} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center font-bold text-green-700 text-sm flex-shrink-0">
                {bot.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{bot.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {stats[bot.id]?.conversations || 0} conversations · {stats[bot.id]?.messages || 0} messages
                </div>
              </div>
              <div className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${bot.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {bot.isActive ? '● Live' : '○ Draft'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick tips */}
      {bots.length === 0 && (
        <div className="mt-8 bg-green-50 rounded-xl p-5 border border-green-100">
          <div className="font-medium text-green-800 mb-2">Quick start tips 🇳🇬</div>
          <ul className="text-sm text-green-700 space-y-1.5">
            <li>→ Start with the &ldquo;Friendly Naija&rdquo; tone — customers love it</li>
            <li>→ Add your menu or price list to the catalog so the bot can quote prices</li>
            <li>→ Test your bot before going live using the built-in chat tester</li>
            <li>→ WhatsApp Business API is free — you only pay per message conversation</li>
          </ul>
        </div>
      )}
    </div>
  )
}
