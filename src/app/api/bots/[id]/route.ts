import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  greeting: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'naija', 'formal']).optional(),
  language: z.string().optional(),
  systemPrompt: z.string().optional(),
  isActive: z.boolean().optional(),
  waPhoneId: z.string().optional(),
  waToken: z.string().optional()
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = db.bots.findById(params.id)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const catalog = db.catalog.findByBotId(params.id)
  const convCount = db.conversations.countByBotId(params.id)
  const msgCount = db.messages.countByBotId(params.id)

  return NextResponse.json({ ...bot, catalog, stats: { conversations: convCount, messages: msgCount } })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = db.bots.findById(params.id)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = UpdateSchema.parse(await req.json())
    const updated = db.bots.update(params.id, body)
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = db.bots.findById(params.id)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  db.bots.delete(params.id)
  return NextResponse.json({ success: true })
}
