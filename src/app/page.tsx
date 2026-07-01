'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-whatsapp rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
          <span className="font-semibold text-gray-900">Waha<span className="text-whatsapp">Bot</span></span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#how" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">How it works</Link>
          <Link href="#pricing" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">Pricing</Link>
          <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link href="/auth?mode=register" className="btn-primary text-sm px-4 py-2">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-100 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Built for Nigerian businesses
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold text-gray-900 leading-tight mb-5 tracking-tight">
          Give your business its own<br />
          <span className="text-whatsapp">AI WhatsApp assistant</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          No code. No developers. Launch an intelligent WhatsApp bot for your shop in under 10 minutes. Your customers already use WhatsApp — meet them there.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/auth?mode=register" className="bg-whatsapp text-white px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-whatsapp-dark transition-colors">
            Launch your bot free →
          </Link>
          <Link href="#how" className="bg-gray-100 text-gray-700 px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-gray-200 transition-colors">
            See how it works
          </Link>
        </div>
        <div className="flex items-center justify-center gap-8 mt-10 text-center">
          {[['98%', 'WhatsApp open rate in NG'], ['< 10min', 'Setup time'], ['₦0', 'to start'], ['24/7', 'Always responding']].map(([n, l]) => (
            <div key={n}>
              <div className="text-2xl font-semibold text-gray-900">{n}</div>
              <div className="text-xs text-gray-400 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp mockup demo */}
      <section className="max-w-sm mx-auto px-6 mb-20">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-whatsapp px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm">MC</div>
            <div>
              <div className="text-white font-semibold text-sm">Mama Chidi&apos;s Kitchen</div>
              <div className="text-white/70 text-xs">Online · AI Assistant</div>
            </div>
          </div>
          <div className="p-4 bg-[#ECE5DD] space-y-2">
            {[
              { role: 'bot', text: "Eku ijoko! Welcome to Mama Chidi's Kitchen 🍲 What would you like to order today?" },
              { role: 'user', text: 'I want jollof rice and chicken' },
              { role: 'bot', text: 'Great choice! Jollof rice + chicken is ₦2,000. Delivery to your area is ₦500. Total: ₦2,500. What\'s your delivery address?' },
              { role: 'user', text: '5 Adeola Street, Lekki Phase 1' },
              { role: 'bot', text: 'Perfect! Please transfer ₦2,500 to 0123456789 (GTBank - Mama Chidi). Send your payment proof and we\'ll start cooking! 🙏' }
            ].map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${m.role === 'bot' ? 'bg-white text-gray-800 rounded-tl-none' : 'bg-[#DCF8C6] text-gray-900 rounded-tr-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-whatsapp uppercase tracking-widest mb-3">How it works</div>
            <h2 className="text-3xl font-semibold text-gray-900">From idea to live bot — in minutes</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '1', t: 'Describe your business', d: 'Tell us what you sell, your hours, FAQs, and how you want customers greeted.' },
              { n: '2', t: 'Customize the bot', d: 'Set the tone — professional, friendly, or Naija casual. Upload your price list.' },
              { n: '3', t: 'Connect WhatsApp', d: 'Link your WhatsApp Business number. We handle the technical setup for you.' },
              { n: '4', t: 'Go live and grow', d: 'Your bot starts responding instantly. Watch conversations and sales in your dashboard.' }
            ].map(s => (
              <div key={s.n} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="w-8 h-8 bg-green-50 text-green-700 rounded-lg flex items-center justify-center font-semibold text-sm mb-3">{s.n}</div>
                <div className="font-semibold text-gray-900 mb-1.5">{s.t}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900">Works for every Nigerian business</h2>
            <p className="text-gray-500 mt-2">From Alaba market traders to Lekki boutiques to Abuja fintech startups.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🛍️', t: 'Online shops & boutiques', d: 'Take orders, show catalogs, confirm payments, handle returns — all on WhatsApp.' },
              { icon: '🍲', t: 'Food & restaurants', d: 'Let customers order, pick delivery slots, and get status updates without calling.' },
              { icon: '🏦', t: 'Fintechs & lenders', d: 'Answer loan FAQs, collect documents, and onboard customers via WhatsApp.' },
              { icon: '💊', t: 'Health & pharmacy', d: 'Book appointments, send reminders, and answer common health questions 24/7.' },
              { icon: '🏫', t: 'Schools & tutors', d: 'Share timetables, collect fees, and communicate with parents in one place.' },
              { icon: '🏠', t: 'Real estate agents', d: 'Share listings, schedule viewings, and qualify buyers automatically.' }
            ].map(u => (
              <div key={u.t} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-2xl mb-3">{u.icon}</div>
                <div className="font-semibold text-gray-900 mb-1">{u.t}</div>
                <div className="text-sm text-gray-500">{u.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900">Priced for Nigeria. Billed in Naira.</h2>
            <p className="text-gray-500 mt-2">No dollar conversion stress. Pay what makes sense for your business.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '₦0', period: 'forever', features: ['1 WhatsApp number', '200 AI messages/month', 'Basic bot builder', 'English + Pidgin'], cta: 'Start free', popular: false },
              { name: 'Business', price: '₦15,000', period: '/month', features: ['3 WhatsApp numbers', '5,000 AI messages/month', 'Full builder + AI training', 'All 5 languages', 'Analytics dashboard', 'Priority support'], cta: 'Get Business', popular: true },
              { name: 'Enterprise', price: 'Custom', period: 'for teams', features: ['Unlimited numbers', 'Unlimited messages', 'Custom AI training', 'CRM integrations', 'White-label option', 'Dedicated support'], cta: 'Contact us', popular: false }
            ].map(p => (
              <div key={p.name} className={`bg-white rounded-xl p-6 border ${p.popular ? 'border-whatsapp ring-2 ring-whatsapp/20 relative' : 'border-gray-200'}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-whatsapp text-white text-xs font-medium px-3 py-1 rounded-full">Most popular</div>}
                <div className="text-sm text-gray-500 font-medium mb-2">{p.name}</div>
                <div className="text-3xl font-semibold text-gray-900 mb-0.5">{p.price}</div>
                <div className="text-sm text-gray-400 mb-5">{p.period}</div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-whatsapp text-base">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth?mode=register" className={`block text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${p.popular ? 'bg-whatsapp text-white hover:bg-whatsapp-dark' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-semibold text-gray-900 mb-3">Your competitors are still answering manually.</h2>
        <p className="text-gray-500 mb-8">Be the first business on your street with a 24/7 AI that speaks Naija.</p>
        <Link href="/auth?mode=register" className="bg-whatsapp text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-whatsapp-dark transition-colors inline-block">
          Launch your bot today →
        </Link>
        <p className="text-gray-400 text-sm mt-4">No credit card. No developer. No wahala.</p>
      </section>

      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        © 2024 WahaBot · Made with ❤️ for Nigerian businesses
      </footer>
    </div>
  )
}
