import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = db.bots.findById(params.id)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const url = new URL(req.url)
  const conversationId = url.searchParams.get('conversationId')

  if (conversationId) {
    const messages = db.messages.findByConversationId(conversationId)
    return NextResponse.json(messages)
  }

  const conversations = db.conversations.findByBotId(params.id)
  const result = conversations.map(conv => {
    const messages = db.messages.findByConversationId(conv.id)
    const last = messages[messages.length - 1]
    return {
      ...conv,
      messageCount: messages.length,
      lastMessage: last ? { content: last.content, role: last.role, createdAt: last.createdAt } : null
    }
  })

  return NextResponse.json(result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
}
