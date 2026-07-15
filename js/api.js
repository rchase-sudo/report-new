import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const { url, anonKey } = window.SUPABASE_CONFIG || {}

if (!url || !anonKey || url.includes('your-project')) {
  console.warn(
    'SUPABASE_CONFIG is not set. Edit js/config.js with your project URL and anon key.'
  )
}

export const supabase = createClient(url, anonKey)

/**
 * Kicks off report generation. Returns almost immediately with a pending
 * row — the actual research/drafting happens server-side in the background
 * (see supabase/functions/generate-report), since it can take longer than
 * Supabase's 150s request limit.
 *
 * Returns: { id, address, formattedAddress, createdAt, status: 'pending' }
 */
export async function startReport(address) {
  const { data, error } = await supabase.functions.invoke('generate-report', {
    body: JSON.stringify({ address }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (error) {
    let detail = error.message
    if (error.context && typeof error.context.json === 'function') {
      try {
        const body = await error.context.json()
        if (body?.error) detail = body.error
      } catch {
        // context body wasn't JSON (or was empty) — fall back to error.message
      }
    }
    throw new Error(detail || 'Failed to start report generation')
  }
  if (!data || typeof data !== 'object' || !('id' in data)) {
    throw new Error('Malformed response from generate-report')
  }
  return data
}

/**
 * Fetches the current state of a report row by id.
 * status is 'pending' | 'ready' | 'error'.
 */
export async function getReport(id) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message || 'Failed to fetch report')
  return data
}

/**
 * Polls getReport(id) until status is 'ready' or 'error', calling onTick
 * with each intermediate row (handy for updating a "still working..." UI).
 * Throws if the report errors out server-side, or if polling exceeds
 * maxWaitMs without resolving.
 */
export async function pollReport(id, { intervalMs = 3000, maxWaitMs = 5 * 60 * 1000, onTick } = {}) {
  const start = Date.now()
  while (true) {
    const row = await getReport(id)
    onTick?.(row)

    if (row.status === 'ready') {
      return {
        id: row.id,
        address: row.address,
        formattedAddress: row.formatted_address,
        createdAt: row.created_at,
        ...row.payload,
      }
    }
    if (row.status === 'error') {
      throw new Error(row.error_message || 'Report generation failed.')
    }
    if (Date.now() - start > maxWaitMs) {
      throw new Error('This is taking longer than expected. Please try again in a moment.')
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}
