import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateSystemPrompt } from '@/lib/ai'
import { z } from 'zod'

const BotSchema = z.object({
  name: z.string().min(1),
  greeting: z.string().min(1),
  tone: z.enum(['professional', 'friendly', 'naija', 'formal']),
  language: z.string(),
  systemPrompt: z.string().optional(),
  businessDescription: z.string().optional(),
  businessType: z.string().optional(),
  waPhoneId: z.string().optional(),
  waToken: z.string().optional()
})

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bots = db.bots.findByBusinessId(session.businessId)
  return NextResponse.json(bots)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = BotSchema.parse(await req.json())

    let systemPrompt = body.systemPrompt || ''

    // Auto-generate system prompt if business description is provided
    if (!systemPrompt && body.businessDescription) {
      systemPrompt = await generateSystemPrompt(
        body.name,
        body.businessType || 'business',
        body.businessDescription
      )
    }

    const bot = db.bots.create({
      businessId: session.businessId,
      name: body.name,
      greeting: body.greeting,
      tone: body.tone,
      language: body.language,
      systemPrompt,
      isActive: false,
      igActive: false,
      currency: 'NGN',
      waPhoneId: body.waPhoneId,
      waToken: body.waToken
    })

    return NextResponse.json(bot, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create bot' }, { status: 500 })
  }
}
