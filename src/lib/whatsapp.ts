import axios from 'axios'

const WA_API_VERSION = 'v20.0'
const WA_BASE = `https://graph.facebook.com/${WA_API_VERSION}`

export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  text?: { body: string }
  type: string
}

export interface WhatsAppWebhookBody {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: { display_phone_number: string; phone_number_id: string }
        messages?: WhatsAppMessage[]
        statuses?: unknown[]
      }
      field: string
    }>
  }>
}

export function parseWebhookMessage(body: WhatsAppWebhookBody): {
  phoneNumberId: string
  from: string
  messageText: string
  messageId: string
} | null {
  try {
    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const message = value?.messages?.[0]

    if (!message || message.type !== 'text') return null

    return {
      phoneNumberId: value.metadata.phone_number_id,
      from: message.from,
      messageText: message.text?.body || '',
      messageId: message.id
    }
  } catch {
    return null
  }
}

export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
): Promise<boolean> {
  try {
    await axios.post(
      `${WA_BASE}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return true
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return false
  }
}

// Mark message as read (shows blue ticks)
export async function markAsRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> {
  try {
    await axios.post(
      `${WA_BASE}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    )
  } catch {
    // Non-critical — ignore
  }
}
