'use client'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Bot { id: string; name: string }
interface Conversation { id: string; customerPhone: string; messageCount: number; lastMessage: { content: string; role: string; createdAt: string } | null; updatedAt: string }
interface Message { id: string; role: string; content: string; createdAt: string }

export default function ConversationsPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState<string>('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/bots').then(r => r.json()).then((data: Bot[]) => {
      setBots(data)
      if (data.length > 0) setSelectedBot(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedBot) return
    setLoading(true)
    fetch(`/api/bots/${selectedBot}/messages`).then(r => r.json()).then(data => {
      setConversations(data)
      setLoading(false)
    })
  }, [selectedBot])

  useEffect(() => {
    if (!selectedConv || !selectedBot) return
    fetch(`/api/bots/${selectedBot}/messages?conversationId=${selectedConv}`).then(r => r.json()).then(setMessages)
  }, [selectedConv, selectedBot])

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Conversations</h1>
        <p className="text-sm text-gray-500 mt-0.5">All customer chats handled by your AI bots</p>
      </div>

      {/* Bot selector */}
      {bots.length > 1 && (
        <div className="mb-4">
          <select className="input max-w-xs" value={selectedBot} onChange={e => setSelectedBot(e.target.value)}>
            {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 h-[520px]">
        {/* Conversation list */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            {conversations.length} conversations
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No conversations yet</div>
            ) : conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv.id)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-green-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">+{conv.customerPhone}</span>
                  <span className="text-xs text-gray-400">{conv.lastMessage ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true }) : ''}</span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {conv.lastMessage?.content || 'No messages'}
                </div>
                <div className="text-xs text-gray-300 mt-1">{conv.messageCount} messages</div>
              </button>
            ))}
          </div>
        </div>

        {/* Message thread */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
          {selectedConv ? (
            <>
              <div className="p-3 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">
                  +{conversations.find(c => c.id === selectedConv)?.customerPhone}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-[#ECE5DD] space-y-2">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg p-3 text-sm max-w-[85%] ${m.role === 'user' ? 'bg-[#DCF8C6] text-gray-900 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                      {m.content}
                      <div className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
