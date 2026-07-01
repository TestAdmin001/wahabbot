'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/auth?action=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-whatsapp rounded-xl flex items-center justify-center text-white font-bold">W</div>
            <span className="font-semibold text-gray-900 text-lg">Waha<span className="text-whatsapp">Bot</span></span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Sign in to your dashboard' : 'Start for free — no credit card needed'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Business name</label>
                <input className="input" placeholder="Mama Chidi's Kitchen" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
            )}
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@business.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            {mode === 'register' && (
              <div>
                <label className="label">Phone number (optional)</label>
                <input className="input" placeholder="+234 800 000 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            )}
            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="text-whatsapp font-medium hover:underline">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>
}
