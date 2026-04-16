export const API_BASE = (() => {
  const param = new URLSearchParams(window.location.search).get("api");
  const base = (param || "http://localhost:8000").trim();
  return base.endsWith("/") ? base.slice(0, -1) : base;
})();

async function jsonFetch(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || text || `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return data;
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function analyzeText(text) {
  return jsonFetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function sessionSummary(sessionLog) {
  return jsonFetch(`${API_BASE}/api/session-summary`, {
    method: "POST",
    body: JSON.stringify({ session_log: sessionLog }),
  });
}

