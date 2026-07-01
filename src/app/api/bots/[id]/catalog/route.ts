import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const CatalogSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.string().optional(),
  isAvailable: z.boolean().optional().default(true)
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = db.bots.findById(params.id)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(db.catalog.findByBotId(params.id))
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = db.bots.findById(params.id)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = CatalogSchema.parse(await req.json())
    const item = db.catalog.create({ botId: params.id, ...body })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const itemId = url.searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  const body = await req.json()
  const item = db.catalog.update(itemId, body)
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const itemId = url.searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  db.catalog.delete(itemId)
  return NextResponse.json({ success: true })
}
