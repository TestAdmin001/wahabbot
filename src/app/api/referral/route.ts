import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, referralDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'code') {
    // Return this business's referral code and stats
    const code = referralDb.getCode(session.businessId)
    const referrals = referralDb.findByReferrerId(session.businessId)
    const rewarded = referralDb.countRewarded(session.businessId)
    const business = db.businesses.findById(session.businessId)
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://wahabot.ng'
    return NextResponse.json({
      code,
      referralLink: `${baseUrl}/auth?ref=${code}`,
      total: referrals.length,
      signedUp: referrals.filter(r => r.status !== 'pending').length,
      paid: referrals.filter(r => r.status === 'paid' || r.status === 'rewarded').length,
      rewarded,
      freeMonthsEarned: rewarded,
      referrals
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  // Apply referral code at registration (called from auth flow)
  if (action === 'apply') {
    const { code, newBusinessId, email } = await req.json()
    const referral = referralDb.findByCode(code)
    if (!referral) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    if (referral.referredEmail !== email && referral.status !== 'pending') {
      return NextResponse.json({ error: 'Code already used' }, { status: 400 })
    }
    referralDb.update(referral.id, { referredId: newBusinessId, status: 'signed_up', referredEmail: email })
    return NextResponse.json({ success: true, message: 'Referral applied! Your referrer will get 1 free month when you subscribe.' })
  }

  // Invite someone (logged in user sends invite)
  if (action === 'invite') {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Check if already referred
    const existing = referralDb.findByEmail(email)
    if (existing) return NextResponse.json({ error: 'This email has already been invited' }, { status: 400 })

    const referral = referralDb.create(session.businessId, email)
    return NextResponse.json({
      success: true,
      code: referral.code,
      message: `Referral created! Share your link and earn 1 free month when they subscribe.`
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
