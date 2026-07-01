import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import axios from 'axios'

const BUMPA_API = 'https://api.getbumpa.com/api/v1'

// Test Bumpa connection
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = db.businesses.findById(session.businessId)
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const url = new URL(req.url)
  const bumpaKey = url.searchParams.get('key')

  if (bumpaKey) {
    // Test the key
    try {
      const res = await axios.get(`${BUMPA_API}/profile`, {
        headers: { Authorization: `Bearer ${bumpaKey}` }
      })
      return NextResponse.json({ connected: true, bumpaStore: res.data?.data?.store_name || 'Connected' })
    } catch {
      return NextResponse.json({ connected: false, error: 'Invalid Bumpa API key' })
    }
  }

  return NextResponse.json({ connected: false })
}

// Push a WahaBot order to Bumpa
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, bumpaApiKey } = await req.json()
  if (!orderId || !bumpaApiKey) {
    return NextResponse.json({ error: 'orderId and bumpaApiKey required' }, { status: 400 })
  }

  const order = db.orders.findById(orderId)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Verify this order belongs to the logged-in business
  const bot = db.bots.findById(order.botId)
  if (!bot || bot.businessId !== session.businessId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Create order in Bumpa
    const bumpaPayload = {
      customer_phone: order.customerPhone,
      items: order.items.map(i => ({
        name: i.name,
        quantity: i.qty,
        price: i.price
      })),
      total: order.total,
      delivery_address: order.deliveryAddress || '',
      payment_status: order.paymentConfirmed ? 'paid' : 'pending',
      source: 'WahaBot WhatsApp',
      note: `Auto-created by WahaBot AI from WhatsApp conversation`
    }

    const res = await axios.post(`${BUMPA_API}/orders`, bumpaPayload, {
      headers: { Authorization: `Bearer ${bumpaApiKey}`, 'Content-Type': 'application/json' }
    })

    return NextResponse.json({ success: true, bumpaOrderId: res.data?.data?.id })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to push to Bumpa'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
