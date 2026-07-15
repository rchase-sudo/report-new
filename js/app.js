import { createClient } from "@supabase/supabase-js";
import { renderReport } from "./report-template.js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.FORMA_CONFIG;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = document.getElementById("app");

const LOADING_MESSAGES = [
  "Pulling parcel and zoning context…",
  "Sizing the development program…",
  "Running the pro forma…",
  "Drafting the report…",
];

function renderIntake({ error } = {}) {
  app.innerHTML = `
    <div class="max-w-xl mx-auto fade-in">
      <div class="report-label text-brass text-xs mb-4 text-center">FORMA</div>
      <h1 class="font-display text-3xl sm:text-4xl text-center mb-3">Development Analysis</h1>
      <p class="text-paper-dim text-center mb-10">
        Enter a property address. FORMA will generate a preliminary development
        analysis in the same format as our standard report.
      </p>

      <form id="intake-form" class="bg-surface border border-line rounded-sm p-6 sm:p-8">
        <label class="report-label text-xs text-paper-dim block mb-2" for="address">
          Property Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          required
          placeholder="e.g. Hwy 120 & E. Paulding Dr, Dallas, GA 30132"
          class="w-full bg-ink border border-line rounded-sm px-4 py-3 text-paper placeholder:text-paper-dim/60 focus:outline-none focus:border-brass mb-6"
        />
        <div class="docket-edge mb-6"></div>
        <button
          type="submit"
          class="w-full bg-brass text-ink font-mono text-sm tracking-wide uppercase py-3 rounded-sm hover:opacity-90 transition"
        >
          Generate Report
        </button>
      </form>

      ${
        error
          ? `<p class="text-rust text-sm text-center mt-4">${error}</p>`
          : ""
      }

      <p class="text-paper-dim text-xs text-center mt-8">
        Preliminary analysis — not for financing or construction.
      </p>
    </div>
  `;

  document.getElementById("intake-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const address = new FormData(e.target).get("address").toString().trim();
    if (!address) return;
    await generateReport(address);
  });
}

function renderLoading() {
  app.innerHTML = `
    <div class="max-w-xl mx-auto text-center fade-in">
      <div class="report-label text-brass text-xs mb-6">FORMA</div>
      <div class="animate-pulse">
        <p id="loading-line" class="font-display text-xl text-paper-dim">
          ${LOADING_MESSAGES[0]}
        </p>
      </div>
    </div>
  `;
  let i = 0;
  const line = document.getElementById("loading-line");
  return setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    if (line) line.textContent = LOADING_MESSAGES[i];
  }, 1800);
}

function renderReportView(report, id) {
  app.innerHTML = `
    <div class="max-w-4xl mx-auto fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-8 no-print">
        <button id="new-report-btn" class="report-label text-xs text-paper-dim hover:text-paper transition">
          &larr; New Report
        </button>
        <div class="flex gap-3">
          ${
            id
              ? `<button id="copy-link-btn" class="report-label text-xs border border-line px-4 py-2 rounded-sm hover:border-brass transition">Copy Link</button>`
              : ""
          }
          <button id="download-btn" class="report-label text-xs bg-brass text-ink px-4 py-2 rounded-sm hover:opacity-90 transition">
            Download PDF
          </button>
        </div>
      </div>
      <div id="report-container"></div>
    </div>
  `;

  document.getElementById("report-container").innerHTML = renderReport(report);

  document.getElementById("new-report-btn").addEventListener("click", () => {
    history.pushState({}, "", window.location.pathname);
    renderIntake();
  });

  const copyBtn = document.getElementById("copy-link-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(window.location.href);
      copyBtn.textContent = "Copied";
      setTimeout(() => (copyBtn.textContent = "Copy Link"), 1500);
    });
  }

  document.getElementById("download-btn").addEventListener("click", () => {
    const el = document.getElementById("report-root");
    const filename = `FORMA-${(report.meta?.docId || report.meta?.address || "report").replace(/[^a-z0-9-]+/gi, "-")}.pdf`;
    window
      .html2pdf()
      .set({
        margin: 0.4,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: "#0b0d0c" },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(el)
      .save();
  });
}

async function generateReport(address) {
  const stopLoading = renderLoading();
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ address }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed (${res.status})`);
    }

    const { id, report } = await res.json();
    clearInterval(stopLoading);

    if (id) history.pushState({}, "", `?id=${id}`);
    renderReportView(report, id);
  } catch (err) {
    clearInterval(stopLoading);
    console.error(err);
    renderIntake({ error: "Couldn't generate that report. Please try again." });
  }
}

async function loadFromPermalink(id) {
  const stopLoading = renderLoading();
  const { data, error } = await supabase
    .from("reports")
    .select("report")
    .eq("id", id)
    .single();
  clearInterval(stopLoading);

  if (error || !data) {
    renderIntake({ error: "That report link couldn't be found." });
    return;
  }
  renderReportView(data.report, id);
}

// --- boot ---
const params = new URLSearchParams(window.location.search);
const existingId = params.get("id");
if (existingId) {
  loadFromPermalink(existingId);
} else {
  renderIntake();
}