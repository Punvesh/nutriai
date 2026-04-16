import { analyzeText, healthCheck, sessionSummary } from "./api.js";
import { initBars, runPipelineAnimation } from "./pipeline.js";
import { initCharts, updateCharts } from "./charts.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const sessionLog = [];

function $(id) {
  return document.getElementById(id);
}

function setBackendStatus(ok, text) {
  const dot = $("apiStatusDot");
  const label = $("apiStatusText");
  if (!dot || !label) return;
  dot.style.background = ok ? "var(--good)" : "var(--bad)";
  dot.style.boxShadow = ok
    ? "0 0 0 6px rgba(69, 212, 131, 0.14)"
    : "0 0 0 6px rgba(255, 107, 107, 0.14)";
  label.textContent = text;
}

function clearChildren(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

function renderTags(host, tags) {
  clearChildren(host);
  if (!host) return;
  for (const t of tags || []) {
    const el = document.createElement("span");
    el.className = "tag";
    el.textContent = t;
    host.appendChild(el);
  }
  if (!tags || tags.length === 0) {
    const el = document.createElement("span");
    el.className = "tag";
    el.textContent = "-";
    host.appendChild(el);
  }
}

function renderList(host, items) {
  clearChildren(host);
  if (!host) return;
  for (const it of items || []) {
    const li = document.createElement("li");
    li.textContent = String(it);
    host.appendChild(li);
  }
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "-";
    host.appendChild(li);
  }
}

function emotionColor(emotion) {
  switch (emotion) {
    case "happy":
      return "rgba(69, 212, 131, 0.22)";
    case "sad":
      return "rgba(110, 168, 254, 0.22)";
    case "angry":
      return "rgba(255, 107, 107, 0.22)";
    case "fear":
      return "rgba(155, 123, 255, 0.22)";
    case "disgust":
      return "rgba(245, 194, 107, 0.22)";
    case "surprise":
      return "rgba(255, 107, 214, 0.22)";
    default:
      return "rgba(255, 255, 255, 0.10)";
  }
}

function renderScores(scores) {
  const host = $("scores");
  if (!host) return;
  host.innerHTML = "";
  const entries = Object.entries(scores || {}).sort((a, b) => b[1] - a[1]);
  for (const [k, v] of entries) {
    const row = document.createElement("div");
    row.className = "score";
    const left = document.createElement("div");
    left.textContent = k;
    left.style.minWidth = "74px";
    const pct = document.createElement("div");
    pct.textContent = `${Number(v).toFixed(1)}%`;
    pct.className = "mono muted";

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("div");
    fill.style.width = `${Math.max(0, Math.min(100, Number(v)))}%`;
    bar.appendChild(fill);

    row.appendChild(left);
    row.appendChild(pct);
    row.appendChild(bar);
    host.appendChild(row);
  }
}

function setResultUI(payload) {
  const emotion = String(payload.emotion || "neutral");
  const confidence = Number(payload.confidence || 0);

  const pill = $("emotionPill");
  const conf = $("confidenceText");
  const stress = $("stressText");
  const advice = $("advice");
  const tip = $("tip");

  if (pill) {
    pill.textContent = emotion;
    pill.style.background = emotionColor(emotion);
  }
  if (conf) conf.textContent = `${confidence.toFixed(1)}%`;
  if (stress) stress.textContent = `Stress: ${payload.stress_level || "low"}`;

  renderTags($("keywords"), payload.keywords_detected || []);
  renderScores(payload.all_emotions || {});

  const nutrition = payload.nutrition || {};
  renderList($("foodsEat"), nutrition.foods_to_eat);
  renderList($("foodsAvoid"), nutrition.foods_to_avoid);
  renderList($("supplements"), nutrition.supplements);
  renderList($("actions"), nutrition.immediate_actions);

  if (advice) advice.textContent = payload.health_advice || "-";
  if (tip) tip.textContent = payload.wellness_tip || "-";
}

function setFiguresFallback() {
  const figs = ["figArchitecture", "figConfusion", "figRoc"];
  for (const id of figs) {
    const img = $(id);
    if (!img) continue;
    img.addEventListener("error", () => {
      img.alt = `${img.alt} (missing)`;
      img.style.opacity = "0.45";
    });
  }
}

async function doAnalyze(text) {
  const finalEl = $("finalTranscript");
  if (finalEl) finalEl.textContent = text;

  initBars();
  const [payload] = await Promise.all([analyzeText(text), runPipelineAnimation()]);
  setResultUI(payload);

  sessionLog.push({
    ts: Date.now(),
    text,
    emotion: payload.emotion,
    confidence: payload.confidence,
    stress_level: payload.stress_level,
  });
  updateCharts(sessionLog);
}

function wireTextAnalyze() {
  const btn = $("btnAnalyzeText");
  const textInput = $("textInput");
  const out = $("sessionSummary");
  if (!btn || !textInput) return;
  btn.addEventListener("click", async () => {
    const text = String(textInput.value || "").trim();
    if (!text) return;
    btn.disabled = true;
    try {
      await doAnalyze(text);
    } catch (e) {
      if (out) out.textContent = `Error: ${e.message || e}`;
    } finally {
      btn.disabled = false;
    }
  });
}

function wireSessionButtons() {
  const btnSum = $("btnSessionSummary");
  const btnClear = $("btnClearSession");
  const out = $("sessionSummary");

  if (btnSum && out) {
    btnSum.addEventListener("click", async () => {
      btnSum.disabled = true;
      try {
        const s = await sessionSummary(sessionLog);
        out.textContent =
          `Dominant: ${s.dominant_emotion}. Trend: ${s.wellness_trend}. Score: ${s.overall_score}. ` +
          `Recs: ${(s.recommendations || []).join(" | ")}`;
      } catch (e) {
        out.textContent = `Error: ${e.message || e}`;
      } finally {
        btnSum.disabled = false;
      }
    });
  }

  if (btnClear && out) {
    btnClear.addEventListener("click", () => {
      sessionLog.length = 0;
      updateCharts(sessionLog);
      out.textContent = "Cleared.";
    });
  }
}

function wireSpeech() {
  const btnStart = $("btnStart");
  const btnStop = $("btnStop");
  const live = $("liveTranscript");
  const out = $("sessionSummary");

  if (!btnStart || !btnStop) return;

  if (!SpeechRecognition) {
    btnStart.disabled = true;
    btnStop.disabled = true;
    if (live) live.textContent = "Web Speech API not supported. Use Chrome/Edge.";
    return;
  }

  const recog = new SpeechRecognition();
  recog.lang = navigator.language || "en-US";
  recog.interimResults = true;
  recog.continuous = true;

  let finalText = "";
  let lastInterim = "";
  let isRunning = false;
  let pendingAnalyze = false;

  recog.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const txt = res[0].transcript;
      if (res.isFinal) finalText += `${txt} `;
      else interim += txt;
    }
    lastInterim = interim || lastInterim;
    if (live) live.textContent = interim || "...";
  };

  recog.onerror = (e) => {
    const msg =
      `Speech error: ${e.error || "unknown"}. ` +
      "Allow mic for this site + check OS microphone privacy settings.";
    if (live) live.textContent = msg;
    if (out) out.textContent = msg;
  };

  recog.onend = () => {
    isRunning = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    if (live) live.textContent = "...";

    // Analyze only after recognition fully ends, so the final transcript is captured.
    if (pendingAnalyze) {
      pendingAnalyze = false;
      const text = (finalText.trim() || lastInterim.trim()).trim();
      if (!text) return;
      doAnalyze(text).catch((e) => {
        if (out) out.textContent = `Error: ${e.message || e}`;
      });
    }
  };

  btnStart.addEventListener("click", async () => {
    finalText = "";
    lastInterim = "";
    pendingAnalyze = false;
    isRunning = true;
    btnStart.disabled = true;
    btnStop.disabled = false;

    try {
      // Helps trigger the permission prompt on some setups before starting recognition.
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      const msg = "Microphone permission denied/unavailable. Enable mic access and retry.";
      if (live) live.textContent = msg;
      if (out) out.textContent = msg;
      isRunning = false;
      btnStart.disabled = false;
      btnStop.disabled = true;
      return;
    }

    try {
      recog.start();
    } catch (e) {
      const msg = `Could not start speech recognition: ${e.message || e}`;
      if (live) live.textContent = msg;
      if (out) out.textContent = msg;
      isRunning = false;
      btnStart.disabled = false;
      btnStop.disabled = true;
    }
  });

  btnStop.addEventListener("click", () => {
    if (!isRunning) return;
    btnStop.disabled = true;
    pendingAnalyze = true;
    try {
      recog.stop();
    } catch (e) {
      pendingAnalyze = false;
      if (out) out.textContent = `Speech stop error: ${e.message || e}`;
    }
  });
}

async function boot() {
  setFiguresFallback();
  initBars();
  initCharts();

  try {
    await healthCheck();
    setBackendStatus(true, "Backend OK");
  } catch {
    setBackendStatus(false, "Backend offline (start FastAPI on :8000)");
  }

  wireSpeech();
  wireTextAnalyze();
  wireSessionButtons();
}

window.addEventListener("DOMContentLoaded", boot);

