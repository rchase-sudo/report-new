// Turns the structured report JSON (produced by the generate-report edge
// function) into the FORMA-styled HTML markup shown on screen and exported
// to PDF. Kept intentionally dumb/declarative — one function per section.

function esc(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function sectionShell(num, kicker, title, inner) {
  return `
    <section class="mb-14">
      <div class="flex items-baseline gap-3 mb-5">
        <span class="report-label text-brass text-xs">${esc(num)}</span>
        <span class="report-label text-paper-dim text-xs">${esc(kicker)}</span>
      </div>
      <h2 class="font-display text-2xl sm:text-3xl mb-6">${esc(title)}</h2>
      ${inner}
    </section>
  `;
}

function statGrid(items = []) {
  return `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-sm overflow-hidden mb-6">
      ${items
        .map(
          (it) => `
        <div class="bg-surface px-4 py-5">
          <div class="font-display text-xl sm:text-2xl text-brass">${esc(it.value)}</div>
          <div class="report-label text-[0.6rem] text-paper-dim mt-1 leading-tight">${esc(it.label)}</div>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function table(headers, rows) {
  return `
    <div class="overflow-x-auto border border-line rounded-sm">
      <table class="report-table w-full text-sm">
        <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${r.map((c) => `<td class="text-paper">${esc(c)}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function narrativeBlock(title, body) {
  return `
    <div class="mb-5">
      ${title ? `<h3 class="font-display text-lg text-brass mb-2">${esc(title)}</h3>` : ""}
      <p class="text-paper-dim leading-relaxed">${esc(body)}</p>
    </div>
  `;
}

function calloutRow(items = []) {
  return `
    <div class="grid sm:grid-cols-3 gap-4 mt-6">
      ${items
        .map(
          (it) => `
        <div class="bg-surface border border-line rounded-sm p-5">
          <div class="font-display text-2xl text-brass mb-1">${esc(it.value)}</div>
          ${it.title ? `<div class="report-label text-[0.6rem] text-paper-dim mb-2">${esc(it.title)}</div>` : ""}
          ${it.narrative ? `<p class="text-sm text-paper-dim leading-relaxed">${esc(it.narrative)}</p>` : ""}
        </div>`
        )
        .join("")}
    </div>
  `;
}

export function renderReport(report) {
  const m = report.meta || {};
  const o = report.opportunitySummary || {};
  const lz = report.locationZoning || {};
  const dp = report.developmentProgram || {};
  const pr = report.permittingRoadmap || {};
  const pf = report.proforma || {};
  const rs = report.returnsByScenario || {};
  const mb = report.maxBuildOut || {};

  return `
    <article id="report-root" class="bg-ink text-paper max-w-4xl mx-auto">

      <!-- Cover / hero -->
      <header class="border-b border-line pb-10 mb-14">
        <div class="report-label text-brass text-xs mb-6">FORMA</div>
        <div class="report-label text-paper-dim text-xs mb-3">Preliminary Development Analysis</div>
        <h1 class="font-display text-3xl sm:text-4xl mb-4">${esc(m.address || "")}</h1>
        <p class="report-label text-paper-dim text-xs">
          ${esc(m.cityStateZip || "")} &middot; ${esc(m.county || "")} &middot; ${esc(m.acreage || "")} &middot; ${esc(m.propertyType || "")}
        </p>
        <p class="report-label text-paper-dim text-[0.65rem] mt-2">
          Prepared ${esc(m.preparedDate || "")} &middot; Confidential
        </p>
      </header>

      ${sectionShell(
        "01",
        "Opportunity Summary",
        o.highestBestUse || "Highest & Best Use",
        `${narrativeBlock("", o.narrative || "")}${statGrid(report.keyMetrics || [])}`
      )}

      ${sectionShell(
        "02",
        "Location & Zoning",
        "Regulatory Position",
        `
          <div class="grid sm:grid-cols-2 gap-8 mb-8">
            ${narrativeBlock(`Current Zoning — ${lz.currentZoning || ""}`, lz.zoningNarrative || "")}
            ${narrativeBlock(lz.sitePositionTitle || "Site Position", lz.sitePositionNarrative || "")}
          </div>
          ${table(
            ["Use Category", "Permit Status", "Fit for This Site", "Notes"],
            (lz.permittedUses || []).map((u) => [u.category, u.status, u.fit, u.notes])
          )}
        `
      )}

      ${sectionShell(
        "03",
        "Development Program",
        "Phased Build-Out",
        `
          ${statGrid([
            { value: dp.grossSite || "", label: `Gross Site — ${dp.grossSiteSubtext || ""}` },
            { value: dp.deductions || "", label: `ROW / Storm / Setback — ${dp.deductionsSubtext || ""}` },
            { value: dp.netDevelopable || "", label: `Net Developable — ${dp.netDevelopableSubtext || ""}` },
          ])}
          ${table(
            ["Component", "Acres", "Building SF", "Parking", "Typical Tenant", "Phase"],
            (dp.components || []).map((c) => [c.component, c.acres, c.buildingSf, c.parking, c.tenant, c.phase])
          )}
          ${
            dp.totals
              ? `<p class="report-label text-paper-dim text-xs mt-3">Total: ${esc(dp.totals.acres || "")} &middot; ${esc(
                  dp.totals.buildingSf || ""
                )} &middot; ${esc(dp.totals.parking || "")}</p>`
              : ""
          }
        `
      )}

      ${sectionShell(
        "04",
        pr.timelineHeadline || "Entitlement Timeline",
        "Permitting Roadmap",
        table(
          ["Permit / Approval", "Agency", "Est. Timeline", "Est. Cost", "Risk"],
          (pr.permits || []).map((p) => [p.permit, p.agency, p.timeline, p.cost, p.risk])
        )
      )}

      ${sectionShell(
        "05",
        "Development Economics",
        "Pro Forma — Base Case",
        `
          <div class="grid sm:grid-cols-3 gap-4 mb-8">
            ${(pf.scenarios || [])
              .map(
                (s) => `
              <div class="bg-surface border border-line rounded-sm p-4">
                <div class="report-label text-brass text-xs mb-2">${esc(s.label)}</div>
                <p class="text-sm text-paper-dim leading-relaxed">${esc(s.description)}</p>
              </div>`
              )
              .join("")}
          </div>
          <h3 class="font-display text-lg text-brass mb-3">Total Development Cost</h3>
          ${table(
            ["Cost Line Item", "Quantity", "Unit Cost", "Subtotal", "Notes"],
            (pf.costLineItems || []).map((c) => [c.item, c.quantity, c.unitCost, c.subtotal, c.notes])
          )}
          <p class="report-label text-paper-dim text-xs mt-3">
            Total Project Cost: ${esc(pf.totalProjectCost || "")} &middot; ${esc(pf.totalCostPerSf || "")}
          </p>

          <h3 class="font-display text-lg text-brass mt-10 mb-3">Stabilized NOI</h3>
          ${table(
            ["Component", "SF Leased", "Rent / SF / Yr", "Gross Revenue", "Notes"],
            (pf.stabilizedNoi?.components || []).map((c) => [c.component, c.sfLeased, c.rentPerSf, c.grossRevenue, c.notes])
          )}
          <div class="mt-4 report-label text-xs text-paper-dim space-y-1">
            <p>Gross Scheduled Income: <span class="text-paper">${esc(pf.stabilizedNoi?.grossScheduledIncome || "")}</span></p>
            <p>Vacancy / Credit Loss: <span class="text-paper">${esc(pf.stabilizedNoi?.vacancyLoss || "")}</span></p>
            <p>Operating Expenses: <span class="text-paper">${esc(pf.stabilizedNoi?.operatingExpenses || "")}</span></p>
            <p class="text-brass">Net Operating Income: <span>${esc(pf.stabilizedNoi?.noi || "")}</span></p>
            <p>Development Yield: <span class="text-paper">${esc(pf.stabilizedNoi?.developmentYield || "")}</span></p>
          </div>
        `
      )}

      ${sectionShell(
        "06",
        "Three Build-Out Outcomes",
        "Returns by Scenario",
        `
          ${table(
            ["Scenario", "TDC", "Stabilized NOI", "Dev. Yield", "Value @ Cap", "Profit / (Loss)", "Status"],
            (rs.scenarios || []).map((s) => [
              s.scenario,
              s.tdc,
              s.stabilizedNoi,
              s.devYield,
              s.valueAtCap,
              s.profitLoss,
              s.status,
            ])
          )}
          ${calloutRow([
            { value: rs.breakevenOccupancy, title: "Breakeven Occupancy (Debt Service)", narrative: rs.breakevenNarrative },
            { value: rs.anchorPadsIncome, title: "Anchor + Pads Alone Generate", narrative: rs.anchorPadsNarrative },
            { value: rs.inlineSfToBreakeven, title: "In-Line SF to Full Breakeven", narrative: rs.inlineSfNarrative },
          ])}
        `
      )}

      ${sectionShell(
        "07",
        "Upside Case",
        "Maximum Build-Out — Profit Scenario",
        `
          <h3 class="font-display text-lg text-brass mb-3">Pad Site Dispositions</h3>
          ${table(
            ["Revenue / Value Event", "Amount", "Basis"],
            (mb.padDispositions || []).map((p) => [p.event, p.amount, p.basis])
          )}
          <p class="report-label text-paper-dim text-xs mt-3">Total Pad Proceeds: ${esc(mb.totalPadProceeds || "")}</p>

          <div class="grid sm:grid-cols-2 gap-8 mt-10">
            <div>
              <h3 class="font-display text-lg text-brass mb-3">Stabilized Asset Value</h3>
              <div class="text-sm text-paper-dim space-y-1">
                <p>NOI: <span class="text-paper">${esc(mb.stabilizedAssetValue?.retainedNoi || "")}</span></p>
                <p>Cap Rate: <span class="text-paper">${esc(mb.stabilizedAssetValue?.capRate || "")}</span></p>
                <p>Gross Asset Value: <span class="text-paper">${esc(mb.stabilizedAssetValue?.grossAssetValue || "")}</span></p>
                <p>Selling Costs: <span class="text-paper">${esc(mb.stabilizedAssetValue?.sellingCosts || "")}</span></p>
                <p class="text-brass">Net Proceeds: <span>${esc(mb.stabilizedAssetValue?.netProceeds || "")}</span></p>
              </div>
            </div>
            <div>
              <h3 class="font-display text-lg text-brass mb-3">Cost Basis</h3>
              <div class="text-sm text-paper-dim space-y-1">
                <p>Total Development Cost: <span class="text-paper">${esc(mb.costBasis?.totalDevCost || "")}</span></p>
                <p>Less Pad Site Proceeds: <span class="text-paper">${esc(mb.costBasis?.padProceeds || "")}</span></p>
                <p class="text-brass">Adjusted Cost Basis: <span>${esc(mb.costBasis?.adjustedBasis || "")}</span></p>
              </div>
            </div>
          </div>

          <div class="bg-surface border border-brass/40 rounded-sm p-6 mt-10 text-center">
            <div class="report-label text-paper-dim text-xs mb-2">Projected Net Development Profit</div>
            <div class="font-display text-3xl text-brass">${esc(mb.netProfit || "")}</div>
            ${mb.netProfitNarrative ? `<p class="text-sm text-paper-dim mt-3">${esc(mb.netProfitNarrative)}</p>` : ""}
          </div>
        `
      )}

      <div class="bg-paper text-ink border-l-4 border-brass rounded-sm p-6 mb-14">
        <h3 class="font-display text-base mb-2">FORMA — Preliminary Development Analysis Disclaimer</h3>
        <p class="text-sm leading-relaxed text-ink/80">${esc(report.disclaimer || "")}</p>
      </div>

      <footer class="border-t border-line pt-6 text-center">
        <div class="report-label text-brass text-xs mb-2">FORMA</div>
        <p class="report-label text-paper-dim text-[0.65rem]">
          ${esc(m.docId || "")} &middot; PREPARED ${esc((m.preparedDate || "").toUpperCase())} &middot; CONFIDENTIAL
        </p>
        <p class="report-label text-paper-dim text-[0.65rem] mt-1">
          PRELIMINARY ANALYSIS — NOT FOR FINANCING OR CONSTRUCTION
        </p>
      </footer>
    </article>
  `;
}