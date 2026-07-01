import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateBotReply, generateReceipt, generateFollowUpMessage } from '@/lib/ai'
import { parseWebhookMessage, sendWhatsAppMessage, markAsRead, WhatsAppWebhookBody } from '@/lib/whatsapp'

const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || 'wahabot-verify-token'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppWebhookBody = await req.json()
    if (body.object !== 'whatsapp_business_account') return NextResponse.json({ status: 'ignored' })

    const parsed = parseWebhookMessage(body)
    if (!parsed) return NextResponse.json({ status: 'no_message' })

    const { phoneNumberId, from, messageText, messageId } = parsed

    const bot = db.bots.findByWaPhoneId(phoneNumberId)
    if (!bot || !bot.isActive) return NextResponse.json({ status: 'bot_not_found' })

    if (bot.waToken) await markAsRead(phoneNumberId, bot.waToken, messageId)

    // Upsert customer record automatically
    db.customers.upsert(bot.id, from)

    const conversation = db.conversations.findOrCreate(bot.id, from)
    db.messages.create({ conversationId: conversation.id, role: 'user', content: messageText })

    const history = db.messages.findByConversationId(conversation.id)
    const catalog = db.catalog.findByBotId(bot.id)

    const { reply, orderDetected, paymentDetected, orderTotal } = await generateBotReply(bot, catalog, history.slice(0, -1), messageText)

    db.messages.create({ conversationId: conversation.id, role: 'assistant', content: reply })

    // Handle order detection — create order record
    if (orderDetected) {
      db.conversations.update(conversation.id, { status: 'ordered' })
      db.orders.create({
        botId: bot.id,
        conversationId: conversation.id,
        customerPhone: from,
        items: [],
        total: orderTotal,
        status: 'pending',
        paymentConfirmed: false,
        receiptSent: false
      })
      db.customers.upsert(bot.id, from, 0)
    }

    // Handle payment confirmation — send receipt automatically
    if (paymentDetected) {
      const orders = db.orders.findByBotId(bot.id).filter(o => o.customerPhone === from && !o.paymentConfirmed)
      if (orders.length > 0) {
        const order = orders[0]
        db.orders.update(order.id, { paymentConfirmed: true, status: 'confirmed' })
        db.customers.upsert(bot.id, from, order.total)

        if (!order.receiptSent && bot.waToken) {
          const receipt = await generateReceipt(order.items, order.total, bot.name)
          await sendWhatsAppMessage(phoneNumberId, bot.waToken, from, receipt)
          db.orders.update(order.id, { receiptSent: true })
        }
      }
    }

    if (bot.waToken) await sendWhatsAppMessage(phoneNumberId, bot.waToken, from, reply)

    // Schedule follow-up if conversation is abandoned (no order after enquiry)
    // We check this lazily — if this message is from a customer who hasn't ordered
    if (!orderDetected && !paymentDetected && conversation.status === 'active') {
      const userMessages = history.filter(m => m.role === 'user')
      // After 3+ user messages with no order, schedule a follow-up for 24hrs later
      if (userMessages.length === 3) {
        const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        const lastItems = catalog.slice(0, 2).map(c => c.name)
        const followUpMsg = await generateFollowUpMessage(bot.name, lastItems, bot.tone)
        db.followUps.create({ botId: bot.id, customerPhone: from, message: followUpMsg, scheduledFor })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
