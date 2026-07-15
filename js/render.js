// ---------- helpers ----------

export function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function money(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return Number(n).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function pct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return `${Number(n).toFixed(2)}%`
}

function sectionLabel(n, title) {
  return `
    <div class="mb-4 flex items-baseline gap-3">
      <span class="font-mono text-xs text-brass">${escapeHtml(n)}</span>
      <span class="font-mono text-xs uppercase tracking-[0.25em] text-paper-dim">${escapeHtml(title)}</span>
      <span class="h-px flex-1 bg-line"></span>
    </div>
  `
}

function stat(label, value) {
  return `
    <div class="rounded-sm border border-line bg-surface px-4 py-3">
      <p class="font-mono text-[10px] uppercase tracking-wider text-paper-dim">${escapeHtml(label)}</p>
      <p class="font-display mt-1 text-lg text-paper">${escapeHtml(value)}</p>
    </div>
  `
}

const CONFIDENCE_STYLES = {
  confirmed: { label: 'sourced', className: 'text-sage border-sage/40 bg-sage/10' },
  estimated: { label: 'benchmark est.', className: 'text-brass border-brass/40 bg-brass/10' },
  unverified: { label: 'unverified', className: 'text-rust border-rust/40 bg-rust/10' },
}

export function renderConfidenceBadge(confidence) {
  const s = CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.unverified
  return `<span class="inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.className}">${s.label}</span>`
}

// ---------- AddressForm ----------

export function renderAddressForm({ disabled }) {
  return `
    <div class="mx-auto w-full max-w-2xl">
      <div class="text-center">
        <span class="font-mono text-xs uppercase tracking-[0.3em] text-brass">
          Docket · Site Intake
        </span>
        <h1 class="font-display mt-4 text-4xl font-medium leading-tight text-paper sm:text-5xl">
          Drop a pin. Get a feasibility file.
        </h1>
        <p class="mx-auto mt-4 max-w-md text-sm leading-relaxed text-paper-dim">
          One address in. A full preliminary development analysis out —
          zoning read, program mix, phased pro forma, and a permitting
          roadmap, ready to hand to the concept generator.
        </p>
      </div>

      <form id="address-form" class="mt-10">
        <div class="flex items-center gap-0 rounded-md border border-line bg-surface focus-within:border-brass/60">
          <span class="pl-4 pr-2 font-mono text-xs text-paper-dim">№</span>
          <input
            id="address-input"
            ${disabled ? 'disabled' : ''}
            placeholder="1200 Hwy 120, Dallas, GA 30132"
            class="w-full bg-transparent py-4 pr-2 font-mono text-sm text-paper placeholder:text-paper-dim/60 focus:outline-none"
            autofocus
          />
          <button
            type="submit"
            id="address-submit"
            disabled
            class="m-1.5 shrink-0 rounded-sm bg-brass px-5 py-3 font-mono text-xs font-medium uppercase tracking-wider text-ink transition hover:bg-brass/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ${disabled ? 'Working' : 'Open file'}
          </button>
        </div>
        <div class="docket-edge mt-4"></div>
      </form>
    </div>
  `
}

// ---------- LoadingReport ----------

const STEPS = [
  'Geocoding parcel',
  'Reading zoning + jurisdiction rules',
  'Pulling traffic counts + growth data',
  'Building the pro forma model',
  'Drafting the report',
]

export function renderLoadingReport(address) {
  return `
    <div class="mx-auto w-full max-w-2xl fade-in">
      <p class="text-center font-mono text-xs uppercase tracking-[0.3em] text-brass">
        Opening file
      </p>
      <p class="mt-2 text-center font-display text-xl text-paper">${escapeHtml(address)}</p>
      <div class="mt-10 space-y-4">
        ${STEPS.map(
          (step, i) => `
          <div
            class="flex items-center gap-4 rounded-md border border-line bg-surface px-4 py-3 fade-in"
            style="animation-delay: ${i * 0.15}s"
          >
            <span class="font-mono text-xs text-paper-dim">
              ${String(i + 1).padStart(2, '0')}
            </span>
            <span class="text-sm text-paper-dim">${step}</span>
            <span class="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-brass"></span>
          </div>`
        ).join('')}
      </div>
      <p class="mt-6 text-center text-xs text-paper-dim">
        This usually takes 20–40 seconds — Claude is researching the site live.
      </p>
    </div>
  `
}

// ---------- ErrorView ----------

export function renderErrorView(message) {
  return `
    <div class="mx-auto w-full max-w-2xl fade-in text-center">
      <p class="font-mono text-xs uppercase tracking-[0.3em] text-rust">
        Could not open file
      </p>
      <p class="mt-3 text-sm text-paper-dim">${escapeHtml(message)}</p>
      <button
        id="error-reset"
        class="mt-8 rounded-sm border border-line px-5 py-3 font-mono text-xs uppercase tracking-wider text-paper transition hover:border-brass/50"
      >
        Try another address
      </button>
    </div>
  `
}

// ---------- ReportView ----------

export function renderReportView(report) {
  const { model } = report

  const factsHtml = report.facts
    .map(
      (f) => `
      <div class="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-line bg-surface px-4 py-3">
        <div class="min-w-0">
          <p class="font-mono text-[10px] uppercase tracking-wider text-paper-dim">${escapeHtml(f.label)}</p>
          <p class="mt-0.5 text-sm text-paper">${escapeHtml(f.value)}</p>
          ${
            f.source_name
              ? `<p class="mt-0.5 truncate text-[11px] text-paper-dim">
                  ${
                    f.source_url
                      ? `<a href="${escapeHtml(f.source_url)}" target="_blank" rel="noreferrer" class="underline decoration-line hover:text-brass">${escapeHtml(f.source_name)}</a>`
                      : escapeHtml(f.source_name)
                  }
                </p>`
              : ''
          }
        </div>
        ${renderConfidenceBadge(f.confidence)}
      </div>`
    )
    .join('')

  const costRowsHtml = model.costLineItems
    .map(
      (c) => `
      <tr class="border-b border-line last:border-0">
        <td class="px-4 py-2 text-paper">${escapeHtml(c.item)}</td>
        <td class="px-4 py-2 text-paper-dim">${c.detail ? escapeHtml(c.detail) : '—'}</td>
        <td class="px-4 py-2 text-right font-mono text-paper">${money(c.amount)}</td>
      </tr>`
    )
    .join('')

  const scenarioRowsHtml = model.scenarios
    .map(
      (s) => `
      <tr class="border-b border-line last:border-0">
        <td class="px-4 py-2 text-paper">${escapeHtml(s.name)}</td>
        <td class="px-4 py-2 text-right font-mono text-paper-dim">${money(s.totalDevelopmentCost)}</td>
        <td class="px-4 py-2 text-right font-mono text-paper-dim">${money(s.stabilizedNOI)}</td>
        <td class="px-4 py-2 text-right font-mono text-paper-dim">${pct(s.devYieldPct)}</td>
        <td class="px-4 py-2 text-right font-mono text-paper-dim">${money(s.valueAtExitCap)}</td>
        <td class="px-4 py-2 text-right font-mono ${s.profitLoss >= 0 ? 'text-sage' : 'text-rust'}">${money(s.profitLoss)}</td>
      </tr>`
    )
    .join('')

  return `
    <div class="mx-auto w-full max-w-3xl fade-in pb-24">
      <div class="flex items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <span class="font-mono text-xs uppercase tracking-[0.3em] text-brass">
            Preliminary feasibility file
          </span>
          <h1 class="font-display mt-2 text-3xl font-medium text-paper">
            ${escapeHtml(report.formattedAddress ?? report.address)}
          </h1>
          <p class="mt-1 font-mono text-xs text-paper-dim">
            Docket ${escapeHtml(String(report.id).slice(0, 8))} · ${escapeHtml(new Date(report.createdAt).toLocaleDateString())}
          </p>
        </div>
        <button
          id="report-reset"
          class="shrink-0 rounded-sm border border-line px-3 py-2 font-mono text-xs uppercase tracking-wider text-paper-dim transition hover:border-brass/50 hover:text-paper"
        >
          New address
        </button>
      </div>

      <section class="mt-10">
        ${sectionLabel('01', 'Opportunity summary')}
        <h2 class="font-display text-xl text-brass">${escapeHtml(report.narrative.highestBestUse)}</h2>
        <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-paper-dim">${escapeHtml(report.narrative.overview)}</p>
      </section>

      <section class="mt-12">
        ${sectionLabel('02', 'Site facts')}
        <div class="grid grid-cols-1 gap-2">
          ${factsHtml}
        </div>
      </section>

      <section class="mt-12">
        ${sectionLabel('03', 'Zoning + permitting')}
        <p class="text-sm leading-relaxed text-paper-dim">${escapeHtml(report.narrative.zoningSummary)}</p>
        <p class="mt-4 text-sm leading-relaxed text-paper-dim">${escapeHtml(report.narrative.permittingNotes)}</p>
      </section>

      <section class="mt-12">
        ${sectionLabel('04', 'Development program')}
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-3">
          ${stat('Gross site', model.siteAreaAcres ? `${model.siteAreaAcres} ac` : '—')}
          ${stat('Net developable', model.netDevelopableAcres ? `${model.netDevelopableAcres} ac` : '—')}
          ${stat('Planned building', model.plannedBuildingSf ? `${Number(model.plannedBuildingSf).toLocaleString()} sf` : '—')}
        </div>

        <div class="mt-6 overflow-hidden rounded-sm border border-line">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-line bg-surface-2 font-mono text-[10px] uppercase tracking-wider text-paper-dim">
                <th class="px-4 py-2 font-normal">Cost line item</th>
                <th class="px-4 py-2 font-normal">Detail</th>
                <th class="px-4 py-2 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${costRowsHtml}
              <tr class="bg-surface-2">
                <td class="px-4 py-2 font-medium text-paper" colspan="2">Total development cost</td>
                <td class="px-4 py-2 text-right font-mono font-medium text-brass">${money(model.totalDevelopmentCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mt-12">
        ${sectionLabel('05', 'Returns by scenario')}
        <div class="overflow-x-auto rounded-sm border border-line">
          <table class="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr class="border-b border-line bg-surface-2 font-mono text-[10px] uppercase tracking-wider text-paper-dim">
                <th class="px-4 py-2 font-normal">Scenario</th>
                <th class="px-4 py-2 text-right font-normal">TDC</th>
                <th class="px-4 py-2 text-right font-normal">Stab. NOI</th>
                <th class="px-4 py-2 text-right font-normal">Yield</th>
                <th class="px-4 py-2 text-right font-normal">Value</th>
                <th class="px-4 py-2 text-right font-normal">Profit</th>
              </tr>
            </thead>
            <tbody>
              ${scenarioRowsHtml}
            </tbody>
          </table>
        </div>
      </section>

      <section class="mt-12 rounded-sm border border-brass/30 bg-brass/5 p-5">
        <p class="text-sm leading-relaxed text-paper-dim">${escapeHtml(report.narrative.disclaimer)}</p>
      </section>

      <div class="mt-10 flex flex-col gap-3 sm:flex-row">
        <button
          id="report-print"
          class="rounded-sm border border-line px-5 py-3 font-mono text-xs uppercase tracking-wider text-paper transition hover:border-brass/50"
        >
          Save as PDF
        </button>
        <button
          disabled
          title="Wire this up to your concept generator's intake endpoint"
          class="rounded-sm bg-brass px-5 py-3 font-mono text-xs font-medium uppercase tracking-wider text-ink opacity-90 transition hover:bg-brass/90"
        >
          Send to concept generator →
        </button>
      </div>
    </div>
  `
}
