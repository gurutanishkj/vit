/**
 * FraudShield Frontend Application Logic
 * Code Cortex 3.0 Hackathon - Finance Track
 */

const API_BASE = ""; // Relative to origin when served by FastAPI

// State
let samplePresets = [];
let modelMetrics = null;

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  buildPcaGrid();
  fetchHealth();
  fetchMetrics();
  fetchSamples();
  setupFormHandler();
});

// Tab Switching
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.tab;
      document.querySelectorAll(".tab-view").forEach(view => {
        view.style.display = view.id === target ? "block" : "none";
      });
    });
  });
}

// Generate PCA input fields (V1 through V28)
function buildPcaGrid() {
  const container = document.getElementById("pca-grid-container");
  if (!container) return;

  // Key PCA features displayed prominently first
  let html = "";
  for (let i = 1; i <= 28; i++) {
    const isSpecial = [4, 12, 14, 17].includes(i);
    const labelExtra = isSpecial ? " (High Impact)" : "";
    html += `
      <div class="input-group">
        <label for="input-v${i}">V${i}${labelExtra}</label>
        <input type="number" id="input-v${i}" name="V${i}" step="0.01" value="0.00">
      </div>
    `;
  }
  container.innerHTML = html;
}

// Toggle Advanced PCA inputs view
function togglePcaInputs() {
  const container = document.getElementById("pca-grid-container");
  const btn = document.getElementById("toggle-pca-btn");
  if (container.style.display === "none" || !container.style.display) {
    container.style.display = "grid";
    btn.innerHTML = "Hide Advanced PCA Vector Fields ▲";
  } else {
    container.style.display = "none";
    btn.innerHTML = "Show Advanced PCA Vector Fields (V1–V28) ▼";
  }
}

// Fetch System Health
async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    const statusText = document.getElementById("system-status-text");
    if (data.status === "healthy") {
      statusText.innerHTML = `Model Active: <strong>${data.model_name}</strong>`;
    } else {
      statusText.textContent = "Model Degraded";
    }
  } catch (err) {
    console.error("Health check failed:", err);
    document.getElementById("system-status-text").textContent = "Offline / Connecting...";
  }
}

// Fetch Metrics for Dashboard
async function fetchMetrics() {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    modelMetrics = await res.json();
    const sel = modelMetrics.selected_model;

    document.getElementById("metric-recall").textContent = `${(sel.recall * 100).toFixed(1)}%`;
    document.getElementById("metric-roc-auc").textContent = sel.roc_auc.toFixed(4);
    document.getElementById("metric-pr-auc").textContent = sel.pr_auc.toFixed(4);
    document.getElementById("metric-precision").textContent = `${(sel.precision * 100).toFixed(1)}%`;

    // Confusion Matrix numbers
    const cm = sel.confusion_matrix;
    document.getElementById("cm-tp").textContent = cm.true_positives.toLocaleString();
    document.getElementById("cm-fp").textContent = cm.false_positives.toLocaleString();
    document.getElementById("cm-tn").textContent = cm.true_negatives.toLocaleString();
    document.getElementById("cm-fn").textContent = cm.false_negatives.toLocaleString();
  } catch (err) {
    console.warn("Could not load metrics:", err);
  }
}

// Fetch Sample Presets
async function fetchSamples() {
  try {
    const res = await fetch(`${API_BASE}/samples`);
    samplePresets = await res.json();
    renderSamplePresets();
  } catch (err) {
    console.warn("Could not load sample presets:", err);
  }
}

function renderSamplePresets() {
  const container = document.getElementById("preset-chips-container");
  if (!container) return;

  container.innerHTML = samplePresets.map((s, idx) => {
    const isDanger = s.expected.includes("FRAUD");
    return `
      <button type="button" class="preset-chip ${isDanger ? 'badge-danger' : ''}" onclick="applyPreset(${idx})">
        <span>${isDanger ? '🚨' : '💳'}</span>
        <span>${s.title} ($${s.data.Amount.toFixed(2)})</span>
      </button>
    `;
  }).join("");
}

function applyPreset(index) {
  const preset = samplePresets[index];
  if (!preset) return;

  // Set Amount & Time
  document.getElementById("input-amount").value = preset.data.Amount;
  document.getElementById("input-time").value = preset.data.Time || 36000;

  // Reset all V inputs to 0 first
  for (let i = 1; i <= 28; i++) {
    const input = document.getElementById(`input-v${i}`);
    if (input) input.value = "0.00";
  }

  // Populate given V features
  for (const [key, val] of Object.entries(preset.data)) {
    if (key.startsWith("V")) {
      const input = document.getElementById(`input-v${key.substring(1)}`);
      if (input) input.value = val;
    }
  }

  // If PCA grid is hidden, make sure the user sees that high-impact fields were set
  showToast(`Loaded Preset: ${preset.title}`);
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.background = "#1e293b";
  toast.style.border = "1px solid #3b82f6";
  toast.style.color = "white";
  toast.style.padding = "10px 18px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "0.85rem";
  toast.style.fontWeight = "600";
  toast.style.zIndex = "9999";
  toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// Transaction Analysis Form Submit Handler
function setupFormHandler() {
  const form = document.getElementById("transaction-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await analyzeTransaction();
  });
}

async function analyzeTransaction() {
  const btn = document.getElementById("analyze-btn");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="status-dot"></span> Analyzing Transaction...`;

  const payload = {
    Amount: parseFloat(document.getElementById("input-amount").value) || 0.0,
    Time: parseFloat(document.getElementById("input-time").value) || 0.0
  };

  for (let i = 1; i <= 28; i++) {
    const input = document.getElementById(`input-v${i}`);
    payload[`V${i}`] = input ? (parseFloat(input.value) || 0.0) : 0.0;
  }

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const result = await res.json();
    displayResults(result);
  } catch (err) {
    alert(`Prediction Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// Render Results on Dashboard
function displayResults(data) {
  document.getElementById("result-placeholder").style.display = "none";
  document.getElementById("result-content").style.display = "flex";

  const isFraud = data.prediction === "FRAUD";
  const probPercent = Math.round(data.fraud_probability * 100);

  // Verdict Badge
  const verdictEl = document.getElementById("verdict-badge");
  verdictEl.className = `result-verdict ${isFraud ? 'verdict-fraud' : 'verdict-legit'}`;
  verdictEl.innerHTML = isFraud 
    ? `🚨 FRAUDULENT TRANSACTION DETECTED`
    : `✅ LEGITIMATE / NORMAL TRANSACTION`;

  // Gauge Meter Animation
  const circumference = 2 * Math.PI * 80; // r=80
  const offset = circumference - (data.fraud_probability * circumference);
  const gaugeProgress = document.getElementById("gauge-progress-circle");
  
  let strokeColor = "#10b981"; // Low risk green
  if (data.risk_level === "MEDIUM") strokeColor = "#f59e0b"; // Medium risk yellow
  if (data.risk_level === "HIGH") strokeColor = "#ef4444"; // High risk red

  gaugeProgress.style.stroke = strokeColor;
  gaugeProgress.style.strokeDasharray = circumference;
  gaugeProgress.style.strokeDashoffset = offset;

  document.getElementById("gauge-percentage-text").textContent = `${probPercent}%`;
  document.getElementById("gauge-percentage-text").style.color = strokeColor;

  // Details
  document.getElementById("result-risk-level").textContent = data.risk_level;
  document.getElementById("result-risk-level").style.color = strokeColor;
  document.getElementById("result-model").textContent = data.model_used;
  document.getElementById("result-scaled-amount").textContent = `$${data.transaction_summary.amount.toFixed(2)}`;

  // Explainability Factors
  const factorsContainer = document.getElementById("factors-list");
  if (data.top_factors && data.top_factors.length > 0) {
    factorsContainer.innerHTML = data.top_factors.map(f => {
      const isElevated = f.direction === "Elevated Risk";
      return `
        <div class="factor-chip">
          <span><strong>${f.feature}</strong> (Impact: ${f.impact > 0 ? '+' : ''}${f.impact})</span>
          <span class="${isElevated ? 'factor-tag-elevated' : 'factor-tag-reduced'}">${f.direction}</span>
        </div>
      `;
    }).join("");
  } else {
    factorsContainer.innerHTML = `<div class="factor-chip"><span>All PCA components within normal operating bounds.</span></div>`;
  }
}
