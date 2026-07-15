import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const { url, anonKey } = window.SUPABASE_CONFIG || {}

if (!url || !anonKey || url.includes('your-project')) {
  console.warn(
    'SUPABASE_CONFIG is not set. Edit js/config.js with your project URL and anon key.'
  )
}

export const supabase = createClient(url, anonKey)

/**
 * Calls the `generate-report` Supabase Edge Function with a raw address
 * string and returns a ReportData-shaped object:
 *
 * {
 *   id, address, formattedAddress, createdAt,
 *   facts: [{ label, value, confidence, source_name, source_url }],
 *   narrative: { highestBestUse, overview, zoningSummary, permittingNotes, disclaimer },
 *   model: { siteAreaAcres, netDevelopableAcres, plannedBuildingSf, costLineItems, totalDevelopmentCost, scenarios }
 * }
 */
export async function generateReport(address) {
  const { data, error } = await supabase.functions.invoke('generate-report', {
    // Explicitly stringify + set Content-Type ourselves rather than relying
    // on invoke()'s automatic body-type detection — this guarantees a real,
    // non-empty JSON body reaches the function regardless of SDK version.
    body: JSON.stringify({ address }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (error) {
    // If the function itself returned a non-2xx response with a JSON body
    // (like our { error: "..." } shape), supabase-js exposes it on
    // error.context — surface that instead of the generic SDK message.
    let detail = error.message
    if (error.context && typeof error.context.json === 'function') {
      try {
        const body = await error.context.json()
        if (body?.error) detail = body.error
      } catch {
        // context body wasn't JSON (or was empty) — fall back to error.message
      }
    }
    throw new Error(detail || 'Failed to generate report')
  }
  if (!data || typeof data !== 'object' || !('id' in data)) {
    throw new Error('Malformed response from generate-report')
  }
  return data
}
