'use client'
import { useState, useEffect } from 'react'

interface ReferralStats {
  code: string; referralLink: string; total: number
  signedUp: number; paid: number; rewarded: number
  freeMonthsEarned: number
  referrals: { id: string; referredEmail: string; status: string; createdAt: string }[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  signed_up: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  rewarded: 'bg-purple-50 text-purple-700'
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral?action=code').then(r => r.json()).then(setStats)
  }, [])

  const copyLink = () => {
    if (stats) {
      navigator.clipboard.writeText(stats.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteResult('')
    const res = await fetch('/api/referral?action=invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail })
    })
    const data = await res.json()
    setInviteResult(data.message || data.error)
    if (res.ok) {
      setInviteEmail('')
      fetch('/api/referral?action=code').then(r => r.json()).then(setStats)
    }
    setInviting(false)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Referral program</h1>
        <p className="text-sm text-gray-500 mt-0.5">Refer other businesses and earn 1 free month for every friend who subscribes</p>
      </div>

      {/* Reward banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-lg font-semibold text-green-900">How it works</div>
            <div className="text-sm text-green-700 mt-1">Share your link → friend signs up → they subscribe → you get 1 free month (₦15,000 value)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">{stats?.freeMonthsEarned || 0}</div>
            <div className="text-xs text-green-600">free months earned</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Invited', value: stats?.total || 0 },
          { label: 'Signed up', value: stats?.signedUp || 0 },
          { label: 'Subscribed', value: stats?.paid || 0 },
          { label: 'Free months', value: stats?.freeMonthsEarned || 0 }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Your link */}
        <div className="card space-y-4">
          <div className="text-sm font-semibold text-gray-900">Your referral link</div>

          <div>
            <label className="label">Referral link</label>
            <div className="flex gap-2">
              <input className="input flex-1 text-xs" value={stats?.referralLink || '...'} readOnly />
              <button onClick={copyLink} className="btn-secondary text-xs px-3 flex-shrink-0">
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Your referral code</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xl font-mono font-bold text-gray-900 tracking-widest text-center">
              {stats?.code || '......'}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="text-sm font-medium text-gray-900 mb-3">Invite by email</div>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="friend@business.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendInvite()}
              />
              <button onClick={sendInvite} disabled={inviting || !inviteEmail} className="btn-primary text-sm px-4 flex-shrink-0">
                {inviting ? '...' : 'Invite'}
              </button>
            </div>
            {inviteResult && (
              <div className="text-xs mt-2 text-gray-600">{inviteResult}</div>
            )}
          </div>

          {/* Share messages */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Ready-to-send WhatsApp message</div>
            <div className="bg-[#ECE5DD] rounded-lg p-3 text-xs text-gray-700 leading-relaxed">
              Hey! I've been using WahaBot to automatically handle my WhatsApp customers with AI — it's been a game changer 🔥. No more manual replies, the bot handles orders and payments 24/7. Sign up with my link and get started free: {stats?.referralLink || '...'}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(`Hey! I've been using WahaBot to automatically handle my WhatsApp customers with AI — it's been a game changer 🔥. No more manual replies, the bot handles orders and payments 24/7. Sign up with my link and get started free: ${stats?.referralLink}`)}
              className="text-xs text-whatsapp font-medium hover:underline mt-2 block"
            >
              Copy this message →
            </button>
          </div>
        </div>

        {/* Referral history */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">People you referred</div>
          {!stats?.referrals?.length ? (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              <div className="text-3xl mb-2">🎁</div>
              No referrals yet. Share your link to start earning free months!
            </div>
          ) : (
            <div className="space-y-2">
              {stats.referrals.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{r.referredEmail}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[r.status] || 'bg-gray-100 text-gray-500'}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
