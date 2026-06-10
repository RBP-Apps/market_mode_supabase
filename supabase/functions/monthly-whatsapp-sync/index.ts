import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  console.log("Starting WhatsApp Sync Edge Function...")

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Use service role for backend operations
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Meta API Environment Variables
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('VITE_WHATSAPP_PHONE_NUMBER_ID')
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('VITE_WHATSAPP_ACCESS_TOKEN')


    const TEMPLATE_NAME = 'solar_alert_hindi' // Hardcoded based on user plan
    const HIGH_PERFORMANCE_TEMPLATE = 'solar_congratulation_market_mode'

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      throw new Error("Missing Meta WhatsApp API credentials in environment")
    }

    const { data: logs, error: logsError } = await supabase
      .from('Monthly_Performance_Logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000)

    if (logsError) throw logsError

    const recentLogs = logs.filter(log => {
      const logDate = new Date(log.created_at)
      const now = new Date()
      const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60)
      
      const specYield = parseFloat(log.spec_yield) || 0
      
      return diffHours <= 720 && specYield < 3
    })



    const highPerformanceLogs = logs.filter(log => {
  const logDate = new Date(log.created_at)
  const now = new Date()
  const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60)

  const specYield = parseFloat(log.spec_yield) || 0

  return diffHours <= 720 && specYield > 5
})


    if (recentLogs.length === 0 && highPerformanceLogs.length === 0) {
  return new Response(JSON.stringify({
    message: "No matching logs found."
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  })
}

    
    const uniqueLogs = []
    const seenInverters = new Set()
    for (const log of recentLogs) {
      if (!seenInverters.has(log.inverter)) {
        seenInverters.add(log.inverter)
        uniqueLogs.push(log)
      }
    }

    console.log(`Found ${uniqueLogs.length} unique inverters recently synced.`)

    // 2. Fetch contact numbers from 'fms' table
    const { data: fmsData, error: fmsError } = await supabase
      .from('fms')
      .select('inverter_id, contact_number, need_type')

    if (fmsError) throw fmsError

    // Create a lookup map for faster access
    const fmsMap = new Map()
    for (const item of fmsData) {
      if (item.inverter_id && item.contact_number) {
        // Ensure contact number is in correct format (usually requires country code, e.g., 91 for India)
        let phoneStr = String(item.contact_number).replace(/\D/g, '')
        if (phoneStr.length === 10) {
          phoneStr = '91' + phoneStr // Prepend India code if missing
        }
        fmsMap.set(String(item.inverter_id).trim(), phoneStr)
      }
    }

    // 3. Process and send WhatsApp messages
    const results = {
      success: 0,
      failed: 0,
      errors: []
    }

    const metaApiUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`

    for (const log of uniqueLogs) {
      const inverterId = String(log.inverter).trim()
      const phoneNumber = fmsMap.get(inverterId)

      if (!phoneNumber) {
        results.failed++
        results.errors.push(`No phone number found for inverter ${inverterId}`)
        continue
      }

    
      const beneficiaryName = String(log.beneficiary || 'ग्राहक').trim()
      const lifetimeKwh = String(log.lifetime || '0')
      const monthlyKwh = String(log.total_kwh || '0')
      const monthRange = String(log.month || '').trim()

      const payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: {
            code: "hi" // Hindi language code
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: beneficiaryName },
                { type: "text", text: lifetimeKwh },
                { type: "text", text: monthlyKwh },
                { type: "text", text: monthRange }
              ]
            }
          ]
        }
      }

      try {
        const wpRes = await fetch(metaApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const wpData = await wpRes.json()

        if (!wpRes.ok) {
          console.error(`Failed to send message to ${phoneNumber}:`, wpData)
          results.failed++
          results.errors.push(`Meta API Error for ${phoneNumber}: ${JSON.stringify(wpData)}`)
        } else {
          results.success++
        }
      } catch (err) {
        console.error(`Fetch error for ${phoneNumber}:`, err.message)
        results.failed++
        results.errors.push(`Network error for ${phoneNumber}: ${err.message}`)
      }

      // Small delay to prevent rate limiting from Meta API
      await new Promise(r => setTimeout(r, 100))
    }



    for (const log of highPerformanceLogs) {

  const inverterId = String(log.inverter).trim()
  const phoneNumber = fmsMap.get(inverterId)

  if (!phoneNumber) continue

  const beneficiaryName = String(log.beneficiary || 'ग्राहक').trim()
  const lifetimeKwh = String(log.lifetime || '0')
  const monthlyKwh = parseFloat(log.total_kwh || 0)
  const monthRange = String(log.month || '').trim()
  

  const customerData = fmsData.find(
    item => String(item.inverter_id).trim() === inverterId
  )

  const needType = customerData?.need_type || 'Residential'

  const ratePerUnit = needType === 'Commercial' ? 10 : 6.5

  const moneySaved = (monthlyKwh * ratePerUnit).toFixed(0)

  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      name: HIGH_PERFORMANCE_TEMPLATE,
      language: {
        code: "hi"
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: beneficiaryName },
            { type: "text", text: lifetimeKwh },
            { type: "text", text: monthlyKwh.toString() },
            { type: "text", text: moneySaved },
            { type: "text", text: monthRange },
          ]
        }
      ]
    }
  }

  try {
    const wpRes = await fetch(metaApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (wpRes.ok) {
      results.success++
    }

  } catch (err) {
    console.error(err)
  }
}






    console.log("WhatsApp sync complete.", results)

    return new Response(JSON.stringify({ 
      message: "WhatsApp notification process finished.",
      results 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Edge function error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
