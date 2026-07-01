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
  const targetIds = botId && botIds.includes(botId) ? [botId] : botIds

  const orders = targetIds.flatMap(id => db.orders.findByBotId(id))
  return NextResponse.json(orders)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const orderId = url.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  const body = await req.json()
  db.orders.update(orderId, body)
  return NextResponse.json({ success: true })
}
