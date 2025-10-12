const API = import.meta.env.VITE_API_BASE;

async function handle(res) {
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
    const err = new Error(`${res.status} ${res.statusText} – ${msg || "Request failed"}`);
    err.status = res.status; err.body = text; throw err;
  }
  try { return JSON.parse(text); } catch { return text; }
}

export const portal = {
  createPublicJob: (body) =>
    fetch(`${API}/public/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  health: () => fetch(`${API}/health`).then(handle),
};
