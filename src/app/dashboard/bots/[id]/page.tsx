'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Bot {
  id: string; name: string; greeting: string; tone: string
  language: string; systemPrompt: string; isActive: boolean
  waPhoneId?: string; waToken?: string
}
interface CatalogItem { id: string; name: string; price: number; description?: string; category?: string; isAvailable: boolean }
interface ChatMessage { role: 'user' | 'assistant'; content: string }

export default function BotPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNew = params.id === 'new'

  const [bot, setBot] = useState<Partial<Bot> & { currency?: string; usdRate?: number }>({
    name: '', greeting: "Welcome! How can I help you today? 😊", tone: 'friendly',
    language: 'english', systemPrompt: '', isActive: false, currency: 'NGN'
  })
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  type Tab = 'builder' | 'catalog' | 'test' | 'connect'
  const [activeTab, setActiveTab] = useState<Tab>('builder')
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', category: '' })
  const [businessDesc, setBusinessDesc] = useState('')
  const chatEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/bots/${params.id}`)
        .then(r => r.json())
        .then(data => {
          setBot(data)
          setCatalog(data.catalog || [])
          setLoading(false)
        })
    }
  }, [params.id, isNew])

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  const save = async () => {
    setSaving(true)
    try {
      const method = isNew ? 'POST' : 'PATCH'
      const url = isNew ? '/api/bots' : `/api/bots/${params.id}`
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bot, businessDescription: businessDesc })
      })
      const data = await res.json()
      if (isNew) router.push(`/dashboard/bots/${data.id}`)
      else setBot(data)
    } finally { setSaving(false) }
  }

  const toggleActive = async () => {
    const updated = await fetch(`/api/bots/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !bot.isActive })
    }).then(r => r.json())
    setBot(updated)
  }

  const sendTestMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput
    setChatInput('')
    setChat(c => [...c, { role: 'user', content: userMsg }])
    setChatLoading(true)
    const res = await fetch(`/api/bots/${params.id}/test`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, history: chat.slice(-8) })
    })
    const data = await res.json()
    setChat(c => [...c, { role: 'assistant', content: data.reply }])
    setChatLoading(false)
  }

  const addCatalogItem = async () => {
    if (!newItem.name || !newItem.price) return
    const res = await fetch(`/api/bots/${params.id}/catalog`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price: parseFloat(newItem.price), isAvailable: true })
    })
    const item = await res.json()
    setCatalog(c => [...c, item])
    setNewItem({ name: '', price: '', description: '', category: '' })
  }

  const deleteCatalogItem = async (id: string) => {
    await fetch(`/api/bots/${params.id}/catalog?itemId=${id}`, { method: 'DELETE' })
    setCatalog(c => c.filter(i => i.id !== id))
  }

  const tones = [
    { value: 'professional', label: 'Professional', desc: 'Formal and business-like' },
    { value: 'friendly', label: 'Friendly', desc: 'Warm and helpful' },
    { value: 'naija', label: 'Friendly Naija', desc: 'Casual Nigerian style' },
    { value: 'formal', label: 'Very formal', desc: 'Corporate and official' }
  ]

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading bot...</div>

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/bots" className="text-gray-400 hover:text-gray-600 text-sm">← Bots</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold text-gray-900">{isNew ? 'New bot' : bot.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              onClick={toggleActive}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${bot.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
            >
              {bot.isActive ? '⏸ Pause bot' : '▶ Go live'}
            </button>
          )}
          <button onClick={save} disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saving ? 'Saving...' : isNew ? 'Create bot' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Status badge */}
      {!isNew && (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-5 ${bot.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${bot.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          {bot.isActive ? 'Live — responding to customers' : 'Draft — not active yet'}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {(['builder', ...(isNew ? [] : ['catalog', 'test', 'connect'])] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-whatsapp text-whatsapp' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'builder' ? 'Bot builder' : tab === 'test' ? 'Test bot' : tab === 'connect' ? 'WhatsApp connect' : 'Catalog'}
          </button>
        ))}
      </div>

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="card">
              <label className="label">Bot name</label>
              <input className="input" placeholder="e.g. Mama Chidi's Assistant" value={bot.name || ''} onChange={e => setBot(b => ({ ...b, name: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1.5">This is what customers see in WhatsApp</p>
            </div>

            <div className="card">
              <label className="label">What does your business do?</label>
              <textarea
                className="input resize-none" rows={3}
                placeholder="e.g. We sell homemade Nigerian food and deliver within Lagos. We take orders Mon-Sat 9am-8pm..."
                value={businessDesc}
                onChange={e => setBusinessDesc(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1.5">We&apos;ll use AI to build the bot&apos;s knowledge from this</p>
            </div>

            <div className="card">
              <label className="label">Greeting message</label>
              <textarea
                className="input resize-none" rows={3}
                value={bot.greeting || ''}
                onChange={e => setBot(b => ({ ...b, greeting: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1.5">First message customers receive</p>
            </div>

            <div className="card">
              <label className="label">Tone of voice</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {tones.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setBot(b => ({ ...b, tone: t.value }))}
                    className={`p-3 rounded-lg border text-left transition-colors ${bot.tone === t.value ? 'border-whatsapp bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className={`text-sm font-medium ${bot.tone === t.value ? 'text-green-700' : 'text-gray-700'}`}>{t.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <label className="label">Currency</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { value: 'NGN', label: '₦ Naira (Nigeria)' },
                  { value: 'USD', label: '$ Dollar (Diaspora)' },
                  { value: 'GBP', label: '£ Pounds (UK)' },
                  { value: 'GHS', label: 'GH₵ Cedi (Ghana)' }
                ].map(c => (
                  <button
                    key={c.value}
                    onClick={() => setBot(b => ({ ...b, currency: c.value as 'NGN' | 'USD' | 'GBP' | 'GHS' }))}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${(bot.currency === c.value) || (!bot.currency && c.value === 'NGN') ? 'bg-green-50 border-green-200 text-green-700 font-medium' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {bot.currency && (bot.currency && bot.currency !== 'NGN') && (
                <div>
                  <label className="label">USD Rate (₦ per $1)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="1600"
                    value={bot.usdRate || ''}
                    onChange={e => setBot(b => ({ ...b, usdRate: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">The bot will auto-convert prices from Naira to the selected currency</p>
                </div>
              )}
            </div>

            <div className="card">
              <label className="label">Languages</label>
              <div className="flex flex-wrap gap-2">
                {['English', 'Pidgin', 'Yoruba', 'Igbo', 'Hausa'].map(lang => {
                  const langs = (bot.language || 'english').split(',')
                  const isSelected = langs.includes(lang.toLowerCase())
                  return (
                    <button
                      key={lang}
                      onClick={() => {
                        const current = (bot.language || '').split(',').filter(Boolean)
                        const updated = isSelected ? current.filter(l => l !== lang.toLowerCase()) : [...current, lang.toLowerCase()]
                        setBot(b => ({ ...b, language: updated.join(',') || 'english' }))
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${isSelected ? 'bg-green-50 border-green-200 text-green-700 font-medium' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="sticky top-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Live preview</div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-whatsapp px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-xs">
                  {(bot.name || 'Bot').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{bot.name || 'Your bot'}</div>
                  <div className="text-white/70 text-xs">Online · AI Assistant</div>
                </div>
              </div>
              <div className="p-4 bg-[#ECE5DD] min-h-32">
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg rounded-tl-none p-3 text-sm max-w-[85%] text-gray-800">
                    {bot.greeting || 'Welcome! How can I help you today? 😊'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="text-xs font-medium text-amber-800 mb-1">💡 Pro tip</div>
              <div className="text-xs text-amber-700">The &ldquo;Friendly Naija&rdquo; tone gets the highest engagement from Nigerian customers. Try greetings like &ldquo;Eku ijoko!&rdquo; or &ldquo;Welcome o!&rdquo;</div>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div>
          <div className="card mb-4">
            <div className="text-sm font-medium text-gray-900 mb-3">Add product or service</div>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Name</label>
                <input className="input" placeholder="Jollof Rice + Chicken" value={newItem.name} onChange={e => setNewItem(i => ({ ...i, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Price (₦)</label>
                <input className="input" type="number" placeholder="2000" value={newItem.price} onChange={e => setNewItem(i => ({ ...i, price: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <input className="input" placeholder="Served with coleslaw and plantain" value={newItem.description} onChange={e => setNewItem(i => ({ ...i, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Category (optional)</label>
                <input className="input" placeholder="Food, Drinks, etc." value={newItem.category} onChange={e => setNewItem(i => ({ ...i, category: e.target.value }))} />
              </div>
            </div>
            <button onClick={addCatalogItem} className="btn-primary text-sm">Add item</button>
          </div>

          {catalog.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              No catalog items yet. Add products so your bot can quote prices.
            </div>
          ) : (
            <div className="space-y-2">
              {catalog.map(item => (
                <div key={item.id} className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    {item.description && <div className="text-xs text-gray-400">{item.description}</div>}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">₦{item.price.toLocaleString()}</div>
                  <button onClick={() => deleteCatalogItem(item.id)} className="text-xs text-red-400 hover:text-red-600 ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-whatsapp px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-xs">
                {(bot.name || 'B').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{bot.name}</div>
                <div className="text-white/70 text-xs">Testing mode</div>
              </div>
            </div>
            <div className="bg-[#ECE5DD] p-3 h-80 overflow-y-auto space-y-2">
              {chat.length === 0 && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg rounded-tl-none p-3 text-sm max-w-[85%] text-gray-800">
                    {bot.greeting}
                  </div>
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 text-sm max-w-[85%] ${m.role === 'user' ? 'bg-[#DCF8C6] text-gray-900 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg rounded-tl-none p-3 text-sm text-gray-400">Typing...</div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <div className="border-t border-gray-100 p-3 flex gap-2">
              <input
                className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-whatsapp"
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendTestMessage()}
              />
              <button onClick={sendTestMessage} className="w-9 h-9 bg-whatsapp rounded-full flex items-center justify-center text-white text-sm hover:bg-whatsapp-dark">→</button>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">This uses real AI. Test different scenarios before going live.</p>
        </div>
      )}

      {/* Connect Tab */}
      {activeTab === 'connect' && (
        <div className="max-w-xl space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <strong>How to get your WhatsApp credentials:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside text-blue-600">
              <li>Go to <a href="https://developers.facebook.com" className="underline">developers.facebook.com</a></li>
              <li>Create a new app → Business type</li>
              <li>Add WhatsApp product to your app</li>
              <li>Copy your Phone Number ID and Permanent Access Token below</li>
              <li>Set your webhook URL to: <code className="bg-blue-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/api/webhook</code></li>
              <li>Verify token: <code className="bg-blue-100 px-1 rounded">wahabot-verify-token</code></li>
            </ol>
          </div>

          <div className="card space-y-4">
            <div>
              <label className="label">WhatsApp Phone Number ID</label>
              <input className="input" placeholder="1234567890123456" value={bot.waPhoneId || ''} onChange={e => setBot(b => ({ ...b, waPhoneId: e.target.value }))} />
            </div>
            <div>
              <label className="label">Access Token</label>
              <input className="input" type="password" placeholder="EAAxxxxxxxx..." value={bot.waToken || ''} onChange={e => setBot(b => ({ ...b, waToken: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Stored securely — never shared</p>
            </div>
            <button onClick={save} className="btn-primary">Save connection</button>
          </div>

          {bot.waPhoneId && bot.waToken && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="text-sm font-medium text-green-800 mb-1">✅ WhatsApp connected</div>
              <div className="text-xs text-green-600">Your bot is ready. Toggle &ldquo;Go live&rdquo; to start responding to customers.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
