// @ts-expect-error: Deno remote import not resolved by TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-expect-error: ESM remote import not resolved by TypeScript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 1. Odmah hendlujemo OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('--- STIGAO NOVI ZAHTEV ---', req.method)

  try {
    // 2. Provera podataka
    let body;
    try {
      body = await req.json();
      console.log('Primljeni body:', JSON.stringify(body));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Greška pri čitanju JSON-a:', message);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { order } = body;

    // 3. Uzimanje kredencijala
    const deno = (globalThis as unknown as { Deno?: { env?: { get?: (name: string) => string | undefined } } }).Deno
    let botToken = ""
    let chatId = ""

    // Prvo pokušavamo iz baze podataka (admin_settings) - ovo je izvor istine iz Admin Panela
    console.log('Pokušavam učitavanje kredencijala iz baze (admin_settings)...')
    const supabaseUrl = deno?.env?.get?.('SUPABASE_URL')
    const supabaseServiceKey = deno?.env?.get?.('SUPABASE_SERVICE_ROLE_KEY')

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: settings, error: settingsError } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['telegram_bot_token', 'telegram_chat_id'])

      if (!settingsError && settings) {
        const tokenSetting = settings.find((s: { key: string; value: string }) => s.key === 'telegram_bot_token')
        const chatSetting = settings.find((s: { key: string; value: string }) => s.key === 'telegram_chat_id')

        if (tokenSetting) botToken = tokenSetting.value
        if (chatSetting) chatId = chatSetting.value
      }
    }

    // Ako nedostaju u bazi, koristi Environment Variables (Secrets) kao fallback
    if (!botToken) {
      botToken = deno?.env?.get?.('TELEGRAM_BOT_TOKEN') || ""
      if (botToken) console.log('Učitan botToken iz Secrets (fallback).')
    }
    if (!chatId) {
      chatId = deno?.env?.get?.('TELEGRAM_CHAT_ID') || ""
      if (chatId) console.log('Učitan chatId iz Secrets (fallback).')
    }

    console.log('Provera kredencijala:', { 
      hasToken: !!botToken, 
      hasChatId: !!chatId 
    })

    if (!botToken || !chatId) {
      throw new Error('TELEGRAM_BOT_TOKEN ili TELEGRAM_CHAT_ID nisu podešeni (ni u Secrets ni u bazi)!')
    }

    if (!order) {
      throw new Error('Podaci o porudžbini (order) nedostaju!')
    }

    // 4. Formatiranje poruke (grupisano po akciji)
    const artikli: Array<any> = Array.isArray(order.artikli) ? order.artikli : [];
    const promoItems = artikli.filter((item) => item.isPromo);
    const regularItems = artikli.filter((item) => !item.isPromo);

    const promoText = promoItems.length > 0
      ? `🎁 Akcija: ${order.promo_title || 'Akcija'} — ${order.promo_price || 0} RSD\n` +
        Object.values(
          promoItems.reduce((acc: Record<string, any>, item: any) => {
            const productId = item.product_id || item.product?.id || 'unknown';
            const variantName = item.variant?.name || 'no-variant';
            const size = item.size || 'N/A';
            const key = `${productId}-${variantName}-${size}`;
            
            if (!acc[key]) {
              acc[key] = { ...item, quantity: 0 };
            }
            acc[key].quantity += (Number(item.quantity) || 1);
            return acc;
          }, {})
        ).map((item: any) => {
          const variantText = item.variant ? `, ${item.variant.name}` : '';
          const sizeText = item.size ? item.size : 'N/A';
          return `• ${item.product.naziv} (${sizeText}${variantText}) x${item.quantity}`;
        }).join('\n')
      : '';

    const regularText = regularItems.length > 0
      ? `🧾 Ostalo:\n` +
        regularItems.map((item: any) => {
          const variantText = item.variant ? `, ${item.variant.name}` : '';
          const sizeText = item.size ? item.size : 'N/A';
          return `- ${item.product.naziv} (${sizeText}${variantText}) x${item.quantity}`;
        }).join('\n')
      : (promoText ? '' : 'Nema artikala');
    const itemsText = [promoText, regularText].filter(Boolean).join('\n');

    const sumaArtikala = Number(order.ukupna_cena) || 0;
    const shipping = typeof order.shipping_cost === 'number'
      ? order.shipping_cost
      : (sumaArtikala <= 5000 ? 500 : sumaArtikala <= 12000 ? 700 : 900);
    const ukupno = sumaArtikala + shipping;

    const message = `
🆕 *Nova porudžbina!*
------------------
🆔 ID: ${order.order_code || order.id || 'Nema ID'}
👤 Kupac: ${order.ime_kupca}
📞 Telefon: ${order.telefon_kupca}
📍 Adresa: ${order.adresa_kupca}, ${order.grad_kupca}
📧 Email: ${order.email_kupca}
------------------
🛒 Artikli:
${itemsText}
------------------
💵 Suma artikala: ${sumaArtikala} RSD
🚚 Poštarina: ${shipping} RSD
💳 UKUPNO: ${ukupno} RSD
    `.trim();

    // 5. Slanje na Telegram
    console.log('Šaljem na Telegram API...');
    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    })

    const telegramResult = await telegramRes.json()
    console.log('Telegram API odgovor:', JSON.stringify(telegramResult))

    if (!telegramResult.ok) {
      throw new Error(`Telegram API greška: ${telegramResult.description}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Kritična greška u funkciji:', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
