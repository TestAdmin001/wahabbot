'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Bot { id: string; name: string; isActive: boolean; tone: string; updatedAt: string }

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bots').then(r => r.json()).then(data => { setBots(data); setLoading(false) })
  }, [])

  const toneLabels: Record<string, string> = { professional: 'Professional', friendly: 'Friendly', naija: 'Friendly Naija', formal: 'Formal' }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My bots</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your AI WhatsApp assistants</p>
        </div>
        <Link href="/dashboard/bots/new" className="btn-primary">+ New bot</Link>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
      ) : bots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <div className="font-semibold text-gray-900 text-lg mb-2">No bots yet</div>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Create your first AI assistant and start serving customers on WhatsApp automatically.</p>
          <Link href="/dashboard/bots/new" className="btn-primary">Create your first bot</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map(bot => (
            <Link key={bot.id} href={`/dashboard/bots/${bot.id}`} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors flex items-center gap-4 group">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center font-bold text-green-700 text-base flex-shrink-0">
                {bot.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{bot.name}</div>
                <div className="text-sm text-gray-400 mt-0.5">{toneLabels[bot.tone] || bot.tone} tone</div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${bot.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {bot.isActive ? '● Live' : '○ Draft'}
                </div>
                <span className="text-gray-300 group-hover:text-gray-400">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
