import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateBotReply } from '@/lib/ai'
import { z } from 'zod'

const TestSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([])
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = db.bots.findById(params.id)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = TestSchema.parse(await req.json())
    const catalog = db.catalog.findByBotId(params.id)

    // Convert history format
    const history = body.history.map(h => ({
      id: 'test',
      conversationId: 'test',
      role: h.role,
      content: h.content,
      createdAt: new Date().toISOString()
    }))

    const reply = await generateBotReply(bot, catalog, history, body.message)
    return NextResponse.json({ reply })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
