import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

interface DbSchema {
  businesses: Business[]
  bots: Bot[]
  conversations: Conversation[]
  messages: Message[]
  catalogItems: CatalogItem[]
  customers: Customer[]
  broadcasts: Broadcast[]
  orders: Order[]
  followUps: FollowUp[]
  referrals: Referral[]
  igMessages: IgMessage[]
}

export interface Business {
  id: string
  name: string
  email: string
  password: string
  phone?: string
  plan: 'starter' | 'business' | 'enterprise'
  createdAt: string
}

export interface Bot {
  id: string
  businessId: string
  name: string
  greeting: string
  tone: 'professional' | 'friendly' | 'naija' | 'formal'
  language: string
  systemPrompt: string
  isActive: boolean
  waPhoneId?: string
  waToken?: string
  // Instagram DM integration
  igPageId?: string
  igAccessToken?: string
  igActive: boolean
  // Multi-currency
  currency: 'NGN' | 'USD' | 'GBP' | 'GHS'
  usdRate?: number   // e.g. 1600 (₦1600 per $1)
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  botId: string
  customerPhone: string
  status: 'active' | 'ordered' | 'abandoned'
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface CatalogItem {
  id: string
  botId: string
  name: string
  description?: string
  price: number
  category?: string
  stock?: number
  isAvailable: boolean
}

export interface Customer {
  id: string
  botId: string
  phone: string
  name?: string
  totalOrders: number
  totalSpent: number
  lastSeen: string
  createdAt: string
  tags: string[]
}

export interface Broadcast {
  id: string
  botId: string
  message: string
  status: 'draft' | 'sending' | 'sent'
  recipientCount: number
  sentCount: number
  createdAt: string
  sentAt?: string
}

export interface Order {
  id: string
  botId: string
  conversationId: string
  customerPhone: string
  items: { name: string; price: number; qty: number }[]
  total: number
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  paymentConfirmed: boolean
  deliveryAddress?: string
  receiptSent: boolean
  createdAt: string
  updatedAt: string
}

export interface FollowUp {
  id: string
  botId: string
  customerPhone: string
  message: string
  scheduledFor: string
  sent: boolean
  createdAt: string
}

export interface Referral {
  id: string
  referrerId: string       // businessId who referred
  referredEmail: string    // email of referred business
  referredId?: string      // set when they sign up
  status: 'pending' | 'signed_up' | 'paid' | 'rewarded'
  code: string             // unique referral code
  createdAt: string
  rewardedAt?: string
}

export interface IgMessage {
  id: string
  botId: string
  igUserId: string
  igUserName?: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

function ensureDb(): DbSchema {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    const empty: DbSchema = {
      businesses: [], bots: [], conversations: [], messages: [],
      catalogItems: [], customers: [], broadcasts: [], orders: [], followUps: [],
      referrals: [], igMessages: []
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2))
    return empty
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  // migrate old DBs that lack new tables
  if (!data.customers) data.customers = []
  if (!data.broadcasts) data.broadcasts = []
  if (!data.orders) data.orders = []
  if (!data.followUps) data.followUps = []
  if (!data.referrals) data.referrals = []
  if (!data.igMessages) data.igMessages = []
  return data
}

function saveDb(data: DbSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export const db = {
  businesses: {
    create: (data: Omit<Business, 'id' | 'createdAt'>): Business => {
      const store = ensureDb()
      const business: Business = { ...data, id: uuid(), createdAt: new Date().toISOString() }
      store.businesses.push(business)
      saveDb(store)
      return business
    },
    findByEmail: (email: string): Business | null =>
      ensureDb().businesses.find(b => b.email === email) ?? null,
    findById: (id: string): Business | null =>
      ensureDb().businesses.find(b => b.id === id) ?? null,
    update: (id: string, data: Partial<Business>): Business | null => {
      const store = ensureDb()
      const i = store.businesses.findIndex(b => b.id === id)
      if (i === -1) return null
      store.businesses[i] = { ...store.businesses[i], ...data }
      saveDb(store)
      return store.businesses[i]
    }
  },

  bots: {
    create: (data: Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>): Bot => {
      const store = ensureDb()
      const bot: Bot = { ...data, igActive: data.igActive ?? false, currency: data.currency ?? 'NGN', id: uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      store.bots.push(bot)
      saveDb(store)
      return bot
    },
    findByBusinessId: (businessId: string): Bot[] =>
      ensureDb().bots.filter(b => b.businessId === businessId),
    findById: (id: string): Bot | null =>
      ensureDb().bots.find(b => b.id === id) ?? null,
    findByWaPhoneId: (waPhoneId: string): Bot | null =>
      ensureDb().bots.find(b => b.waPhoneId === waPhoneId) ?? null,
    update: (id: string, data: Partial<Bot>): Bot | null => {
      const store = ensureDb()
      const i = store.bots.findIndex(b => b.id === id)
      if (i === -1) return null
      store.bots[i] = { ...store.bots[i], ...data, updatedAt: new Date().toISOString() }
      saveDb(store)
      return store.bots[i]
    },
    delete: (id: string) => {
      const store = ensureDb()
      store.bots = store.bots.filter(b => b.id !== id)
      saveDb(store)
    }
  },

  conversations: {
    findOrCreate: (botId: string, customerPhone: string): Conversation => {
      const store = ensureDb()
      const existing = store.conversations.find(c => c.botId === botId && c.customerPhone === customerPhone)
      if (existing) return existing
      const conv: Conversation = { id: uuid(), botId, customerPhone, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      store.conversations.push(conv)
      saveDb(store)
      return conv
    },
    findByBotId: (botId: string): Conversation[] =>
      ensureDb().conversations.filter(c => c.botId === botId),
    countByBotId: (botId: string): number =>
      ensureDb().conversations.filter(c => c.botId === botId).length,
    update: (id: string, data: Partial<Conversation>) => {
      const store = ensureDb()
      const i = store.conversations.findIndex(c => c.id === id)
      if (i !== -1) { store.conversations[i] = { ...store.conversations[i], ...data, updatedAt: new Date().toISOString() }; saveDb(store) }
    }
  },

  messages: {
    create: (data: Omit<Message, 'id' | 'createdAt'>): Message => {
      const store = ensureDb()
      const msg: Message = { ...data, id: uuid(), createdAt: new Date().toISOString() }
      store.messages.push(msg)
      saveDb(store)
      return msg
    },
    findByConversationId: (conversationId: string): Message[] =>
      ensureDb().messages.filter(m => m.conversationId === conversationId),
    countByBotId: (botId: string): number => {
      const store = ensureDb()
      const convIds = store.conversations.filter(c => c.botId === botId).map(c => c.id)
      return store.messages.filter(m => convIds.includes(m.conversationId)).length
    },
    recent: (botId: string, limit = 20): (Message & { customerPhone: string })[] => {
      const store = ensureDb()
      const convMap = new Map(store.conversations.filter(c => c.botId === botId).map(c => [c.id, c.customerPhone]))
      return store.messages
        .filter(m => convMap.has(m.conversationId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map(m => ({ ...m, customerPhone: convMap.get(m.conversationId)! }))
    }
  },

  catalog: {
    create: (data: Omit<CatalogItem, 'id'>): CatalogItem => {
      const store = ensureDb()
      const item: CatalogItem = { ...data, id: uuid() }
      store.catalogItems.push(item)
      saveDb(store)
      return item
    },
    findByBotId: (botId: string): CatalogItem[] =>
      ensureDb().catalogItems.filter(i => i.botId === botId),
    update: (id: string, data: Partial<CatalogItem>): CatalogItem | null => {
      const store = ensureDb()
      const i = store.catalogItems.findIndex(c => c.id === id)
      if (i === -1) return null
      store.catalogItems[i] = { ...store.catalogItems[i], ...data }
      saveDb(store)
      return store.catalogItems[i]
    },
    decrementStock: (botId: string, itemName: string) => {
      const store = ensureDb()
      const i = store.catalogItems.findIndex(c => c.botId === botId && c.name.toLowerCase() === itemName.toLowerCase() && c.stock !== undefined)
      if (i !== -1 && store.catalogItems[i].stock! > 0) {
        store.catalogItems[i].stock! -= 1
        if (store.catalogItems[i].stock === 0) store.catalogItems[i].isAvailable = false
        saveDb(store)
      }
    },
    delete: (id: string) => {
      const store = ensureDb()
      store.catalogItems = store.catalogItems.filter(i => i.id !== id)
      saveDb(store)
    }
  },

  customers: {
    upsert: (botId: string, phone: string, spent = 0): Customer => {
      const store = ensureDb()
      const existing = store.customers.find(c => c.botId === botId && c.phone === phone)
      if (existing) {
        existing.lastSeen = new Date().toISOString()
        if (spent > 0) { existing.totalOrders += 1; existing.totalSpent += spent }
        saveDb(store)
        return existing
      }
      const c: Customer = { id: uuid(), botId, phone, totalOrders: spent > 0 ? 1 : 0, totalSpent: spent, lastSeen: new Date().toISOString(), createdAt: new Date().toISOString(), tags: [] }
      store.customers.push(c)
      saveDb(store)
      return c
    },
    findByBotId: (botId: string): Customer[] =>
      ensureDb().customers.filter(c => c.botId === botId).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()),
    count: (botId: string): number =>
      ensureDb().customers.filter(c => c.botId === botId).length,
    update: (id: string, data: Partial<Customer>) => {
      const store = ensureDb()
      const i = store.customers.findIndex(c => c.id === id)
      if (i !== -1) { store.customers[i] = { ...store.customers[i], ...data }; saveDb(store) }
    }
  },

  broadcasts: {
    create: (data: Omit<Broadcast, 'id' | 'createdAt' | 'sentCount'>): Broadcast => {
      const store = ensureDb()
      const b: Broadcast = { ...data, id: uuid(), sentCount: 0, createdAt: new Date().toISOString() }
      store.broadcasts.push(b)
      saveDb(store)
      return b
    },
    findByBotId: (botId: string): Broadcast[] =>
      ensureDb().broadcasts.filter(b => b.botId === botId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    update: (id: string, data: Partial<Broadcast>) => {
      const store = ensureDb()
      const i = store.broadcasts.findIndex(b => b.id === id)
      if (i !== -1) { store.broadcasts[i] = { ...store.broadcasts[i], ...data }; saveDb(store) }
    }
  },

  orders: {
    create: (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order => {
      const store = ensureDb()
      const o: Order = { ...data, id: uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      store.orders.push(o)
      saveDb(store)
      return o
    },
    findByBotId: (botId: string): Order[] =>
      ensureDb().orders.filter(o => o.botId === botId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    findById: (id: string): Order | null =>
      ensureDb().orders.find(o => o.id === id) ?? null,
    update: (id: string, data: Partial<Order>) => {
      const store = ensureDb()
      const i = store.orders.findIndex(o => o.id === id)
      if (i !== -1) { store.orders[i] = { ...store.orders[i], ...data, updatedAt: new Date().toISOString() }; saveDb(store) }
    },
    totalRevenue: (botId: string): number =>
      ensureDb().orders.filter(o => o.botId === botId && o.paymentConfirmed).reduce((s, o) => s + o.total, 0),
    count: (botId: string): number =>
      ensureDb().orders.filter(o => o.botId === botId).length
  },

  followUps: {
    create: (data: Omit<FollowUp, 'id' | 'createdAt' | 'sent'>): FollowUp => {
      const store = ensureDb()
      const f: FollowUp = { ...data, id: uuid(), sent: false, createdAt: new Date().toISOString() }
      store.followUps.push(f)
      saveDb(store)
      return f
    },
    getDue: (): FollowUp[] => {
      const now = new Date().toISOString()
      return ensureDb().followUps.filter(f => !f.sent && f.scheduledFor <= now)
    },
    markSent: (id: string) => {
      const store = ensureDb()
      const i = store.followUps.findIndex(f => f.id === id)
      if (i !== -1) { store.followUps[i].sent = true; saveDb(store) }
    },
    findByBotId: (botId: string): FollowUp[] =>
      ensureDb().followUps.filter(f => f.botId === botId)
  }
}

// ── Referrals ──
export const referralDb = {
  create: (referrerId: string, referredEmail: string): Referral => {
    const store = ensureDb()
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const r: Referral = { id: uuid(), referrerId, referredEmail, status: 'pending', code, createdAt: new Date().toISOString() }
    store.referrals.push(r)
    saveDb(store)
    return r
  },
  findByReferrerId: (referrerId: string): Referral[] =>
    ensureDb().referrals.filter(r => r.referrerId === referrerId),
  findByCode: (code: string): Referral | null =>
    ensureDb().referrals.find(r => r.code === code) ?? null,
  findByEmail: (email: string): Referral | null =>
    ensureDb().referrals.find(r => r.referredEmail === email) ?? null,
  update: (id: string, data: Partial<Referral>) => {
    const store = ensureDb()
    const i = store.referrals.findIndex(r => r.id === id)
    if (i !== -1) { store.referrals[i] = { ...store.referrals[i], ...data }; saveDb(store) }
  },
  countRewarded: (referrerId: string): number =>
    ensureDb().referrals.filter(r => r.referrerId === referrerId && r.status === 'rewarded').length,
  getCode: (businessId: string): string => {
    // Generate a stable code from businessId
    return businessId.substring(0, 6).toUpperCase()
  }
}

// ── Instagram Messages ──
export const igDb = {
  create: (data: Omit<IgMessage, 'id' | 'createdAt'>): IgMessage => {
    const store = ensureDb()
    const m: IgMessage = { ...data, id: uuid(), createdAt: new Date().toISOString() }
    store.igMessages.push(m)
    saveDb(store)
    return m
  },
  findByBotAndUser: (botId: string, igUserId: string): IgMessage[] =>
    ensureDb().igMessages.filter(m => m.botId === botId && m.igUserId === igUserId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  findByBotId: (botId: string): IgMessage[] =>
    ensureDb().igMessages.filter(m => m.botId === botId),
  countByBotId: (botId: string): number =>
    ensureDb().igMessages.filter(m => m.botId === botId).length,
  recentConversations: (botId: string): { igUserId: string; igUserName?: string; lastMessage: string; createdAt: string }[] => {
    const msgs = ensureDb().igMessages.filter(m => m.botId === botId)
    const userMap = new Map<string, IgMessage>()
    msgs.forEach(m => {
      const ex = userMap.get(m.igUserId)
      if (!ex || new Date(m.createdAt) > new Date(ex.createdAt)) userMap.set(m.igUserId, m)
    })
    return Array.from(userMap.values()).map(m => ({
      igUserId: m.igUserId, igUserName: m.igUserName,
      lastMessage: m.content, createdAt: m.createdAt
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
}
