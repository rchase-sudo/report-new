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
    body: { address },
  })

  if (error) {
    throw new Error(error.message || 'Failed to generate report')
  }
  if (!data || typeof data !== 'object' || !('id' in data)) {
    throw new Error('Malformed response from generate-report')
  }
  return data
}
