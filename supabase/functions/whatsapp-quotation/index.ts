import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('VITE_WHATSAPP_ACCESS_TOKEN')
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('VITE_WHATSAPP_PHONE_NUMBER_ID')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, customerName, pdfUrl } = await req.json()

    // Clean phone number (remove +, spaces, ensure it has 91)
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone
    }

    // Build components array
    const components: object[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName }, // {{1}} = Beneficiary Name
        ],
      },
    ]

    // If PDF URL is available, attach as document header
    if (pdfUrl) {
      components.unshift({
        type: 'header',
        parameters: [
          {
            type: 'document',
            document: {
              link: pdfUrl,
              filename: 'Quotation.pdf',
            },
          },
        ],
      })
    }

    const response = await fetch(
      `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: 'send_qoutation_market_mode',
            language: {
              code: 'en',
            },
            components,
          },
        }),
      }
    )

    const result = await response.json()

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
