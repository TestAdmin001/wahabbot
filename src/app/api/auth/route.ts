import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, signToken } from '@/lib/auth'
import { z } from 'zod'

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional()
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'register') {
    try {
      const body = RegisterSchema.parse(await req.json())
      
      const existing = db.businesses.findByEmail(body.email)
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }

      const hashedPassword = await hashPassword(body.password)
      const business = db.businesses.create({
        name: body.name,
        email: body.email,
        password: hashedPassword,
        phone: body.phone,
        plan: 'starter'
      })

      const token = signToken({ businessId: business.id, email: business.email })
      
      const res = NextResponse.json({ 
        business: { id: business.id, name: business.name, email: business.email, plan: business.plan }
      })
      res.cookies.set('wahabot-token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
      return res
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
      }
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
  }

  if (action === 'login') {
    try {
      const body = LoginSchema.parse(await req.json())
      const business = db.businesses.findByEmail(body.email)
      
      if (!business || !(await verifyPassword(body.password, business.password))) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const token = signToken({ businessId: business.id, email: business.email })
      
      const res = NextResponse.json({
        business: { id: business.id, name: business.name, email: business.email, plan: business.plan }
      })
      res.cookies.set('wahabot-token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
      return res
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
      }
      return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
  }

  if (action === 'logout') {
    const res = NextResponse.json({ success: true })
    res.cookies.delete('wahabot-token')
    return res
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.get('action') === 'me') {
    const { getSession } = await import('@/lib/auth')
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business = db.businesses.findById(session.businessId)
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ id: business.id, name: business.name, email: business.email, plan: business.plan })
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
