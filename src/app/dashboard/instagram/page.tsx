'use client'
import { useState, useEffect } from 'react'

interface Bot { id: string; name: string; igActive: boolean; igPageId?: string }
interface IgStats { botId: string; botName: string; igActive: boolean; igPageId?: string; conversations: { igUserId: string; igUserName?: string; lastMessage: string; createdAt: string }[]; totalMessages: number }

export default function InstagramPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [stats, setStats] = useState<IgStats[]>([])
  const [selectedBot, setSelectedBot] = useState('')
  const [pageId, setPageId] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/bots').then(r => r.json()).then((data: Bot[]) => {
      setBots(data)
      if (data.length > 0) {
        setSelectedBot(data[0].id)
        const b = data[0]
        if (b.igPageId) setPageId(b.igPageId)
      }
    })
    fetch('/api/instagram/stats').then(r => r.json()).then(setStats)
  }, [])

  const saveConnection = async () => {
    setSaving(true)
    await fetch(`/api/bots/${selectedBot}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ igPageId: pageId, igAccessToken: token, igActive: true })
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    fetch('/api/instagram/stats').then(r => r.json()).then(setStats)
  }

  const totalIgMessages = stats.reduce((s, b) => s + b.totalMessages, 0)
  const totalIgConvs = stats.reduce((s, b) => s + b.conversations.length, 0)

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Instagram DM AI</h1>
        <p className="text-sm text-gray-500 mt-0.5">Auto-reply to Instagram DMs with the same AI that handles WhatsApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'IG conversations', value: totalIgConvs },
          { label: 'IG messages handled', value: totalIgMessages },
          { label: 'Active IG bots', value: stats.filter(s => s.igActive).length }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Setup */}
        <div className="card space-y-5">
          <div className="text-sm font-semibold text-gray-900">Connect Instagram</div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-700">
            <strong>How to connect:</strong>
            <ol className="mt-2 space-y-1.5 list-decimal list-inside text-purple-600 text-xs">
              <li>Go to developers.facebook.com → your app</li>
              <li>Add Instagram product → Basic Display or Messaging</li>
              <li>Connect your Instagram Business account</li>
              <li>Set webhook URL: <code className="bg-purple-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/api/instagram</code></li>
              <li>Subscribe to <strong>messages</strong> webhook field</li>
              <li>Copy your Page ID and Access Token below</li>
            </ol>
          </div>

          {bots.length > 1 && (
            <div>
              <label className="label">Which bot handles Instagram?</label>
              <select className="input" value={selectedBot} onChange={e => setSelectedBot(e.target.value)}>
                {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Instagram Page ID</label>
            <input className="input" placeholder="123456789012345" value={pageId} onChange={e => setPageId(e.target.value)} />
          </div>
          <div>
            <label className="label">Page Access Token</label>
            <input className="input" type="password" placeholder="EAAxxxxxxxx..." value={token} onChange={e => setToken(e.target.value)} />
          </div>

          <button onClick={saveConnection} disabled={saving || !pageId || !token} className="btn-primary">
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Connect Instagram'}
          </button>

          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
            Once connected, your bot will automatically reply to anyone who DMs your Instagram account — using the same AI, catalog, and tone as your WhatsApp bot.
          </div>
        </div>

        {/* Recent IG conversations */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">Recent Instagram DMs</div>
          {stats.flatMap(s => s.conversations).length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              <div className="text-3xl mb-2">📸</div>
              No Instagram DMs yet. Connect your account to start.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.flatMap(s => s.conversations.map(c => ({ ...c, botName: s.botName }))).slice(0, 15).map((c, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(c.igUserName || 'IG').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{c.igUserName || `User ${c.igUserId.slice(-4)}`}</div>
                      <div className="text-xs text-gray-400">{c.botName}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 truncate pl-10">{c.lastMessage}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
