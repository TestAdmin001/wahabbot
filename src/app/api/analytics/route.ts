import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const botId = url.searchParams.get('botId')

  const bots = db.bots.findByBusinessId(session.businessId)
  const targetBots = botId ? bots.filter(b => b.id === botId) : bots

  const stats = targetBots.map(bot => {
    const conversations = db.conversations.findByBotId(bot.id)
    const orders = db.orders.findByBotId(bot.id)
    const customers = db.customers.findByBotId(bot.id)
    const revenue = db.orders.totalRevenue(bot.id)
    const msgCount = db.messages.countByBotId(bot.id)

    // Conversion rate: conversations that led to orders
    const orderedConvs = conversations.filter(c => c.status === 'ordered').length
    const conversionRate = conversations.length > 0
      ? Math.round((orderedConvs / conversations.length) * 100)
      : 0

    // Peak hours from messages
    const allMessages = conversations.flatMap(c => db.messages.findByConversationId(c.id).filter(m => m.role === 'user'))
    const hourCounts: Record<number, number> = {}
    allMessages.forEach(m => {
      const h = new Date(m.createdAt).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
    })

    // Top questions (simple keyword extraction)
    const wordCount: Record<string, number> = {}
    allMessages.forEach(m => {
      m.content.toLowerCase().split(/\s+/).forEach(w => {
        if (w.length > 4) wordCount[w] = (wordCount[w] || 0) + 1
      })
    })
    const topWords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w)

    return {
      botId: bot.id,
      botName: bot.name,
      conversations: conversations.length,
      messages: msgCount,
      customers: customers.length,
      orders: orders.length,
      revenue,
      conversionRate,
      avgOrderValue: orders.length > 0 ? Math.round(revenue / orders.filter(o => o.paymentConfirmed).length || 0) : 0,
      hourCounts,
      topWords
    }
  })

  return NextResponse.json(stats)
}
