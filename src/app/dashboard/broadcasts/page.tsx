'use client'
import { useState, useEffect } from 'react'

interface Bot { id: string; name: string }
interface Broadcast { id: string; message: string; status: string; recipientCount: number; sentCount: number; createdAt: string; sentAt?: string }

export default function BroadcastsPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState('')
  const [message, setMessage] = useState('')
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sentCount: number; total: number } | null>(null)
  const [customerCount, setCustomerCount] = useState(0)

  useEffect(() => {
    fetch('/api/bots').then(r => r.json()).then((data: Bot[]) => {
      setBots(data)
      if (data.length > 0) setSelectedBot(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedBot) return
    fetch(`/api/broadcasts?botId=${selectedBot}`).then(r => r.json()).then(setBroadcasts)
    fetch(`/api/customers?botId=${selectedBot}`).then(r => r.json()).then((c: unknown[]) => setCustomerCount(c.length))
  }, [selectedBot])

  const send = async () => {
    if (!message.trim() || !selectedBot) return
    setSending(true)
    setResult(null)
    const res = await fetch('/api/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId: selectedBot, message })
    })
    const data = await res.json()
    setResult(data)
    setMessage('')
    setSending(false)
    fetch(`/api/broadcasts?botId=${selectedBot}`).then(r => r.json()).then(setBroadcasts)
  }

  const templates = [
    { label: 'Flash sale', text: '🔥 FLASH SALE! Get 20% off everything today only. Reply "ORDER" to buy now before it sells out!' },
    { label: 'Restock alert', text: '✅ Good news! Your favourite items are back in stock. Reply now to place your order before they sell out again!' },
    { label: 'New arrivals', text: '🆕 New arrivals just dropped! We have fresh items you will love. Reply "CATALOG" to see everything.' },
    { label: 'Holiday promo', text: '🎉 Special holiday offer just for our loyal customers! Reply to get your exclusive discount code.' }
  ]

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Broadcasts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send WhatsApp messages to all your customers at once — 98% open rate</p>
      </div>

      {bots.length > 1 && (
        <div className="mb-4">
          <select className="input max-w-xs" value={selectedBot} onChange={e => setSelectedBot(e.target.value)}>
            {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="card">
          <div className="text-sm font-semibold text-gray-900 mb-4">New broadcast</div>

          <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-lg">
            <div className="text-sm font-medium text-green-800">
              {customerCount} customers will receive this
            </div>
            <div className="text-xs text-green-600 mt-0.5">All customers who have ever messaged your bot</div>
          </div>

          <div className="mb-3">
            <label className="label">Message</label>
            <textarea
              className="input resize-none"
              rows={5}
              placeholder="Type your broadcast message here..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <div className="text-xs text-gray-400 mt-1">{message.length} characters</div>
          </div>

          <div className="mb-4">
            <label className="label">Quick templates</label>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <button
                  key={t.label}
                  onClick={() => setMessage(t.text)}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
              ✅ Sent to {result.sentCount} of {result.total} customers
            </div>
          )}

          <button
            onClick={send}
            disabled={sending || !message.trim() || customerCount === 0}
            className="btn-primary w-full"
          >
            {sending ? `Sending to ${customerCount} customers...` : `Send to ${customerCount} customers`}
          </button>

          {customerCount === 0 && (
            <p className="text-xs text-gray-400 text-center mt-2">You need customers first. They appear automatically when people message your bot.</p>
          )}
        </div>

        {/* History */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">Broadcast history</div>
          {broadcasts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              No broadcasts sent yet
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-sm text-gray-800 mb-2 line-clamp-2">{b.message}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {b.sentAt ? new Date(b.sentAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'sent' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {b.status === 'sent' ? `✓ ${b.sentCount}/${b.recipientCount} sent` : b.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
