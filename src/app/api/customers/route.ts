import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const botId = url.searchParams.get('botId')

  const bots = db.bots.findByBusinessId(session.businessId)
  const botIds = bots.map(b => b.id)

  if (botId && !botIds.includes(botId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const targetBotIds = botId ? [botId] : botIds
  const customers = targetBotIds.flatMap(id => db.customers.findByBotId(id))

  return NextResponse.json(customers)
}
