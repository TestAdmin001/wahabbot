import Anthropic from '@anthropic-ai/sdk'
import { Bot, CatalogItem, Message } from './db'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

function buildSystemPrompt(bot: Bot, catalog: CatalogItem[]): string {
  const toneMap: Record<string, string> = {
    professional: 'professional, formal and courteous',
    friendly: 'warm, friendly and helpful',
    naija: 'friendly Nigerian Pidgin English — casual, warm, uses Nigerian expressions naturally like "oya", "abeg", "no wahala"',
    formal: 'very formal and business-like'
  }

  // Multi-currency pricing
  const currency = bot.currency || 'NGN'
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', GHS: 'GH₵' }
  const symbol = symbols[currency] || '₦'
  const usdRate = bot.usdRate || 1600

  function formatPrice(nairaPrice: number): string {
    if (currency === 'NGN') return `₦${nairaPrice.toLocaleString()}`
    if (currency === 'USD') return `$${(nairaPrice / usdRate).toFixed(2)}`
    if (currency === 'GBP') return `£${(nairaPrice / (usdRate * 1.27)).toFixed(2)}`
    if (currency === 'GHS') return `GH₵${(nairaPrice / 160).toFixed(2)}`
    return `₦${nairaPrice.toLocaleString()}`
  }

  const availableCatalog = catalog.filter(i => i.isAvailable)
  const catalogText = availableCatalog.length > 0
    ? `\n\nAvailable products/services:\n${availableCatalog.map(i => `- ${i.name}: ${formatPrice(i.price)}${i.description ? ` (${i.description})` : ''}${i.stock !== undefined ? ` [${i.stock} in stock]` : ''}`).join('\n')}`
    : ''

  const outOfStock = catalog.filter(i => !i.isAvailable && i.stock === 0)
  const outOfStockText = outOfStock.length > 0
    ? `\n\nCurrently out of stock (do NOT take orders for these):\n${outOfStock.map(i => `- ${i.name}`).join('\n')}`
    : ''

  return `You are ${bot.name}, an AI assistant for a Nigerian business on WhatsApp.

Tone: ${toneMap[bot.tone] || 'friendly and helpful'}
${bot.systemPrompt ? `\nBusiness context: ${bot.systemPrompt}` : ''}${catalogText}${outOfStockText}

Rules:
- Keep responses SHORT — WhatsApp messages should be 2–4 sentences max
- Use ₦ for Nigerian Naira prices
- Quote prices directly from the catalog above only — never invent prices
- For orders, collect: items wanted, delivery address, customer name
- When a customer confirms an order, say "ORDER_CONFIRMED" followed by item names and total
- When you detect payment proof (transfer screenshot description), say "PAYMENT_CONFIRMED" and the amount
- If stock runs out, tell the customer and offer to notify them when restocked
- End responses with a clear next step when relevant
- Never make up information not in your context`
}

export async function generateBotReply(
  bot: Bot,
  catalog: CatalogItem[],
  history: Message[],
  userMessage: string
): Promise<{ reply: string; orderDetected: boolean; paymentDetected: boolean; orderTotal: number }> {
  const systemPrompt = buildSystemPrompt(bot, catalog)

  const messages: Anthropic.MessageParam[] = history
    .slice(-12)
    .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))

  messages.push({ role: 'user', content: userMessage })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const raw = textBlock?.text || "I'm sorry, I couldn't process that. Please try again."

    const orderDetected = raw.includes('ORDER_CONFIRMED')
    const paymentDetected = raw.includes('PAYMENT_CONFIRMED')

    // Extract order total from reply
    let orderTotal = 0
    const totalMatch = raw.match(/₦([\d,]+)/)
    if (totalMatch) orderTotal = parseInt(totalMatch[1].replace(/,/g, ''))

    // Clean internal signals from the reply shown to customer
    const reply = raw
      .replace(/ORDER_CONFIRMED/g, '✅ Order confirmed!')
      .replace(/PAYMENT_CONFIRMED/g, '✅ Payment confirmed!')

    return { reply, orderDetected, paymentDetected, orderTotal }
  } catch (error) {
    console.error('Claude API error:', error)
    return { reply: "Apologies, I'm having trouble right now. Please try again in a moment.", orderDetected: false, paymentDetected: false, orderTotal: 0 }
  }
}

export async function generateSystemPrompt(businessName: string, businessType: string, description: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Create a concise WhatsApp bot system prompt for this Nigerian business:
Business name: ${businessName}
Type: ${businessType}
Description: ${description}

Write 2-3 sentences describing what the bot should know and how it should help customers. Focus on practical business operations. No fluff.`
    }]
  })
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.text || `You are a helpful assistant for ${businessName}.`
}

export async function generateReceipt(orderItems: { name: string; price: number; qty: number }[], total: number, businessName: string): Promise<string> {
  const itemLines = orderItems.map(i => `${i.name} x${i.qty} = ₦${(i.price * i.qty).toLocaleString()}`).join('\n')
  return `🧾 *RECEIPT — ${businessName}*\n\n${itemLines}\n\n*Total: ₦${total.toLocaleString()}*\n\nThank you for your order! 🙏`
}

export async function generateFollowUpMessage(botName: string, items: string[], tone: string): Promise<string> {
  const toneHint = tone === 'naija' ? 'in Nigerian Pidgin English' : tone === 'friendly' ? 'warmly and casually' : 'professionally'
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Write a short WhatsApp follow-up message ${toneHint} from ${botName} to a customer who asked about ${items.join(', ')} but didn't order. 2 sentences max. Be friendly, not pushy. Include a call to action.`
    }]
  })
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.text || `Hi! You asked about ${items.join(', ')} earlier. Still interested? We'd love to help you with your order! 😊`
}
