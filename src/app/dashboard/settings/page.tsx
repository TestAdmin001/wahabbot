'use client'
import { useState } from 'react'
import { useBusiness } from '../context'

export default function SettingsPage() {
  const business = useBusiness()
  const [saved, setSaved] = useState(false)

  const plans = [
    { id: 'starter', name: 'Starter', price: '₦0/month', features: ['1 bot', '200 messages/month', 'English + Pidgin'] },
    { id: 'business', name: 'Business', price: '₦15,000/month', features: ['3 bots', '5,000 messages/month', 'All languages', 'Analytics'] },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Unlimited bots', 'Unlimited messages', 'White-label', 'Dedicated support'] }
  ]

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and subscription</p>
      </div>

      {/* Account */}
      <div className="card mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Business name</label>
            <input className="input" defaultValue={business?.name} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" type="email" defaultValue={business?.email} disabled />
          </div>
        </div>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          className="btn-primary mt-4 text-sm"
        >
          {saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Plan */}
      <div className="card mb-5">
        <h2 className="font-semibold text-gray-900 mb-1">Current plan</h2>
        <p className="text-sm text-gray-500 mb-4">You&apos;re on the <strong>{business?.plan}</strong> plan</p>
        <div className="space-y-3">
          {plans.map(plan => (
            <div key={plan.id} className={`p-4 rounded-xl border transition-colors ${business?.plan === plan.id ? 'border-whatsapp bg-green-50' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-gray-900">{plan.name}</div>
                <div className="text-sm font-semibold text-gray-900">{plan.price}</div>
              </div>
              <div className="text-xs text-gray-500">{plan.features.join(' · ')}</div>
              {business?.plan !== plan.id && (
                <button className="mt-2 text-xs text-whatsapp font-medium hover:underline">
                  {plan.id === 'enterprise' ? 'Contact us →' : 'Upgrade →'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bumpa integration */}
      <div className="card mb-5">
        <h2 className="font-semibold text-gray-900 mb-1">Bumpa integration</h2>
        <p className="text-sm text-gray-500 mb-4">Connect your Bumpa account to automatically push WahaBot orders into your Bumpa dashboard</p>
        <div className="space-y-3">
          <div>
            <label className="label">Bumpa API Key</label>
            <input className="input" type="password" placeholder="Get from Bumpa → Settings → API" />
            <p className="text-xs text-gray-400 mt-1">Find this in your Bumpa account under Settings → Integrations → API Key</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm">Test connection</button>
            <button className="btn-primary text-sm">Save Bumpa key</button>
          </div>
        </div>
        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
          <div className="text-xs font-medium text-green-800 mb-1">What this does</div>
          <div className="text-xs text-green-700">Every order your WhatsApp bot takes automatically appears in your Bumpa orders — inventory updates, receipts, everything synced. WahaBot handles the sale, Bumpa handles the operations.</div>
        </div>
      </div>

      {/* Webhook info */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">WhatsApp webhook</h2>
        <div className="space-y-2 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-1">Webhook URL</div>
            <code className="block bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 break-all">
              {typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/api/webhook
            </code>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Verify token</div>
            <code className="block bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700">
              wahabot-verify-token
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
