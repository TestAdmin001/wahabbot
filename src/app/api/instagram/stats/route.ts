import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, igDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const botId = url.searchParams.get('botId')

  const bots = db.bots.findByBusinessId(session.businessId)
  const targetBots = botId ? bots.filter(b => b.id === botId) : bots

  const result = targetBots.map(bot => ({
    botId: bot.id,
    botName: bot.name,
    igActive: bot.igActive,
    igPageId: bot.igPageId,
    conversations: igDb.recentConversations(bot.id),
    totalMessages: igDb.countByBotId(bot.id)
  }))

  return NextResponse.json(result)
}
