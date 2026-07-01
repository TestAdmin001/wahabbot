import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const botId = url.searchParams.get('botId')
  if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 })

  const bot = db.bots.findById(botId)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(db.broadcasts.findByBotId(botId))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { botId, message } = await req.json()
  if (!botId || !message) return NextResponse.json({ error: 'botId and message required' }, { status: 400 })

  const bot = db.bots.findById(botId)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const customers = db.customers.findByBotId(botId)

  const broadcast = db.broadcasts.create({
    botId,
    message,
    status: 'sending',
    recipientCount: customers.length
  })

  // Send to all customers asynchronously
  let sentCount = 0
  if (bot.waToken && bot.waPhoneId) {
    for (const customer of customers) {
      try {
        await sendWhatsAppMessage(bot.waPhoneId, bot.waToken, customer.phone, message)
        sentCount++
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100))
      } catch (e) {
        console.error('Broadcast send error:', e)
      }
    }
  }

  db.broadcasts.update(broadcast.id, {
    status: 'sent',
    sentCount,
    sentAt: new Date().toISOString()
  })

  return NextResponse.json({ success: true, sentCount, total: customers.length })
}
