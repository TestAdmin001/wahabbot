import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

export default async function StorePage({ params }: { params: { slug: string } }) {
  // slug = bot id
  const bot = db.bots.findById(params.slug)
  if (!bot || !bot.isActive) notFound()

  const catalog = db.catalog.findByBotId(bot.id).filter(i => i.isAvailable)
  const business = db.businesses.findById(bot.businessId)

  const waLink = `https://wa.me/${bot.waPhoneId?.replace(/\D/g, '')}?text=Hi! I'd like to order`

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{bot.name} — Order on WhatsApp</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, sans-serif; background: #f0f2f5; }
          .header { background: #25D366; padding: 20px 16px; text-align: center; }
          .avatar { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #fff; margin: 0 auto 10px; }
          .biz-name { color: #fff; font-size: 20px; font-weight: 600; }
          .biz-sub { color: rgba(255,255,255,.8); font-size: 13px; margin-top: 4px; }
          .container { max-width: 480px; margin: 0 auto; padding: 16px; }
          .section-title { font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: .8px; margin: 16px 0 10px; }
          .item { background: #fff; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
          .item-name { font-size: 15px; font-weight: 500; color: #111; }
          .item-desc { font-size: 12px; color: #888; margin-top: 2px; }
          .item-price { font-size: 16px; font-weight: 600; color: #25D366; flex-shrink: 0; margin-left: 12px; }
          .cta { position: sticky; bottom: 16px; margin-top: 24px; }
          .cta a { display: block; background: #25D366; color: #fff; text-align: center; padding: 16px; border-radius: 14px; font-size: 16px; font-weight: 600; text-decoration: none; }
          .cta a:active { background: #1a9e4c; }
          .wa-icon { margin-right: 8px; }
          .empty { text-align: center; padding: 40px 20px; color: #888; font-size: 14px; }
          .by { text-align: center; font-size: 11px; color: #bbb; padding: 20px; }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div className="avatar">{bot.name.slice(0, 2).toUpperCase()}</div>
          <div className="biz-name">{bot.name}</div>
          {business && <div className="biz-sub">{business.name}</div>}
        </div>

        <div className="container">
          {catalog.length === 0 ? (
            <div className="empty">No products listed yet. Message us on WhatsApp to ask about our offerings!</div>
          ) : (
            <>
              {/* Group by category */}
              {Array.from(new Set(catalog.map(i => i.category || 'Products'))).map(cat => (
                <div key={cat}>
                  <div className="section-title">{cat}</div>
                  {catalog.filter(i => (i.category || 'Products') === cat).map(item => (
                    <div key={item.id} className="item">
                      <div>
                        <div className="item-name">{item.name}</div>
                        {item.description && <div className="item-desc">{item.description}</div>}
                      </div>
                      <div className="item-price">₦{item.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          <div className="cta">
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <span className="wa-icon">💬</span>
              Order on WhatsApp
            </a>
          </div>
        </div>

        <div className="by">Powered by WahaBot</div>
      </body>
    </html>
  )
}
