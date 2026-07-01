# WahaBot 🤖

**AI WhatsApp assistant platform for Nigerian businesses.**

Give any business — food vendor, boutique, fintech, school — their own 24/7 AI assistant on WhatsApp. No code, no developers, ready in 10 minutes.

---

## What's built

### Core features
- **Auth system** — register/login with JWT sessions
- **Bot builder** — configure name, greeting, tone, language, system prompt
- **AI engine** — Claude Haiku powers all conversations (fast + cheap)
- **WhatsApp webhook** — receives messages from Meta Cloud API, replies in real-time
- **Catalog management** — add products/prices so the bot can quote them
- **Conversation dashboard** — see all customer chats
- **Bot testing** — test bot responses without WhatsApp before going live
- **Multi-tenant** — each business has isolated bots and conversations

### Tech stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API routes (Node.js) |
| AI | Claude Haiku via Anthropic SDK |
| WhatsApp | Meta WhatsApp Business Cloud API |
| Database | JSON file store (dev) → PostgreSQL (prod) |
| Auth | JWT (httpOnly cookies) + bcrypt |
| Billing | Paystack (ready to wire up) |

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### 3. Run development server
```bash
npm run dev
```

Open http://localhost:3000

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/page.tsx               # Login / register
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + auth check
│   │   ├── page.tsx                # Overview / stats
│   │   ├── bots/
│   │   │   ├── page.tsx            # Bot list
│   │   │   └── [id]/page.tsx       # Bot builder + tester
│   │   ├── conversations/page.tsx  # Customer chats
│   │   └── settings/page.tsx       # Account + plan
│   └── api/
│       ├── auth/route.ts           # Register / login / logout
│       ├── bots/
│       │   ├── route.ts            # List + create bots
│       │   └── [id]/
│       │       ├── route.ts        # Get / update / delete bot
│       │       ├── test/route.ts   # Test bot without WhatsApp
│       │       ├── catalog/route.ts # Product catalog CRUD
│       │       └── messages/route.ts # Conversation history
│       └── webhook/route.ts        # WhatsApp message handler
├── lib/
│   ├── db.ts                       # JSON file database
│   ├── auth.ts                     # JWT + bcrypt utils
│   ├── ai.ts                       # Claude API integration
│   └── whatsapp.ts                 # WhatsApp Cloud API
```

---

## WhatsApp setup

1. Create a Meta Developer account at https://developers.facebook.com
2. Create a new app → Business type
3. Add WhatsApp → WhatsApp Business API
4. Get your **Phone Number ID** and **Permanent Access Token**
5. Set webhook URL: `https://yourdomain.com/api/webhook`
6. Set verify token: `wahabot-verify-token` (or change in .env)
7. Subscribe to `messages` webhook field
8. In the bot builder, go to "WhatsApp connect" tab and enter your credentials

---

## Upgrading to production

### Database
Replace the JSON file store with PostgreSQL:
1. Set `DATABASE_URL` in .env
2. Replace `src/lib/db.ts` with Prisma client (schema already in `prisma/schema.prisma`)

### Deployment
```bash
# Deploy to Vercel (recommended)
npx vercel

# Or Railway
railway up
```

### Billing (Paystack)
Wire up `PAYSTACK_SECRET_KEY` and add subscription endpoints to handle plan upgrades.

---

## Business model

| Revenue stream | How |
|----------------|-----|
| Direct SaaS | SMEs subscribe ₦15,000/month |
| Agency white-label | Agencies pay ₦20k wholesale, charge ₦50k+ to their clients |
| Enterprise | Fintechs, banks, telcos — custom pricing ₦500k+/month |

**Target**: 500 SME subscribers = ₦7.5M MRR (~$5,000 USD)

---

## Next steps to build

- [ ] Paystack billing integration
- [ ] Multi-language AI responses (Yoruba, Igbo, Hausa)
- [ ] Analytics charts (conversations over time, top questions)
- [ ] Bot templates (food ordering, real estate, pharmacy)
- [ ] Agency / white-label dashboard
- [ ] Broadcast messages (send to all customers)
- [ ] CRM integration (export customer data)
- [ ] Handoff to human agent when bot can't help

---

Built with ❤️ for Nigerian businesses.
