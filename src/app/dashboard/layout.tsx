'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BizContext, Business } from './context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [business, setBusiness] = useState<Business | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth?action=me')
      .then(r => r.ok ? r.json() : null)
      .then(data => data ? setBusiness(data) : router.push('/auth'))
  }, [router])

  const logout = async () => {
    await fetch('/api/auth?action=logout', { method: 'POST' })
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/dashboard/bots', label: 'My bots', icon: '🤖' },
    { href: '/dashboard/conversations', label: 'Conversations', icon: '💬' },
    { href: '/dashboard/customers', label: 'Customers', icon: '👥' },
    { href: '/dashboard/orders', label: 'Orders', icon: '📦' },
    { href: '/dashboard/broadcasts', label: 'Broadcasts', icon: '📢' },
    { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
    { href: '/dashboard/instagram', label: 'Instagram DM', icon: '📸' },
    { href: '/dashboard/referral', label: 'Refer & earn', icon: '🎁' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' }
  ]

  if (!business) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 text-sm">Loading...</div></div>
  }

  return (
    <BizContext.Provider value={business}>
      <div className="min-h-screen flex bg-gray-50">
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-100 flex flex-col transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-whatsapp rounded-lg flex items-center justify-center text-white font-bold text-xs">W</div>
              <span className="font-semibold text-gray-900 text-sm">Waha<span className="text-whatsapp">Bot</span></span>
            </Link>
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-800 truncate">{business.name}</div>
              <div className="text-xs text-gray-400 capitalize">{business.plan} plan</div>
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === item.href ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            {business.plan === 'starter' && (
              <Link href="/dashboard/settings" className="block text-center text-xs bg-whatsapp text-white py-1.5 rounded-lg hover:bg-whatsapp-dark transition-colors mb-3">
                Upgrade plan
              </Link>
            )}
            <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Sign out →</button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500">☰</button>
            <span className="font-semibold text-gray-900 text-sm">WahaBot</span>
          </div>
          {children}
        </main>
      </div>
    </BizContext.Provider>
  )
}
