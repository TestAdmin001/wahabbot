import { NextRequest, NextResponse } from 'next/server'
import { db, igDb } from '@/lib/db'
import type { Bot } from '@/lib/db'
import { generateBotReply } from '@/lib/ai'
import axios from 'axios'

const IG_VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || 'wahabot-verify-token'
const IG_API = 'https://graph.facebook.com/v20.0'

// GET: Verify webhook with Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === IG_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST: Incoming Instagram DM
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.object !== 'instagram') return NextResponse.json({ status: 'ignored' })

    for (const entry of body.entry || []) {
      const pageId = entry.id
      for (const event of entry.messaging || []) {
        if (!event.message || event.message.is_echo) continue

        const igUserId = event.sender.id
        const messageText = event.message.text
        if (!messageText) continue

        // Find the bot connected to this Instagram page
        const bots = db.bots.findByBusinessId('') // we need to search all bots
        // Search all businesses for a bot with this igPageId
        const allBots = getAllBots()
        const partialBot = allBots.find(b => b.igPageId === pageId && b.igActive)
        if (!partialBot) continue
        const bot = partialBot as Bot

        // Save incoming message
        igDb.create({ botId: bot.id, igUserId, role: 'user', content: messageText })

        // Get conversation history for context
        const history = igDb.findByBotAndUser(bot.id, igUserId).map(m => ({
          id: m.id, conversationId: igUserId, role: m.role, content: m.content, createdAt: m.createdAt
        }))

        const catalog = db.catalog.findByBotId(bot.id)
        const { reply } = await generateBotReply(bot, catalog, history.slice(0, -1), messageText)

        // Save bot reply
        igDb.create({ botId: bot.id, igUserId, role: 'assistant', content: reply })

        // Send reply via Instagram Messaging API
        if (bot.igAccessToken) {
          await sendIgMessage(pageId, bot.igAccessToken, igUserId, reply)
        }
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Instagram webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function getAllBots(): Partial<Bot>[] {
  const fs = require('fs')
  const path = require('path')
  const dbPath = path.join(process.cwd(), 'data', 'db.json')
  if (!fs.existsSync(dbPath)) return []
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
  return data.bots || []
}

async function sendIgMessage(pageId: string, accessToken: string, recipientId: string, text: string) {
  try {
    await axios.post(
      `${IG_API}/${pageId}/messages`,
      { recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('Instagram send error:', e)
  }
}
