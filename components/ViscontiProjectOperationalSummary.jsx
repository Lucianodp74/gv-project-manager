"use client";

import React, { useEffect, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getRows(path) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  return response.json();
}

function fmt(v) {
  return v ? new Date(`${v}T00:00:00`).toLocaleDateString("it-IT") : "—";
}

const attentionLabel = {
  blocked: "Bloccato",
  terna_rejected: "Conferma Terna respinta",
  urgent: "Scadenza urgente",
  waiting_terna: "In attesa Terna",
  critical: "Criticità",
  attention: "Da seguire",
  normal: "In linea",
};

export default function ViscontiProjectOperationalSummary({ projectId }) {
  const [row, setRow] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    const q = encodeURIComponent(projectId);
    getRows(`project_operational_summary?project_id=eq.${q}&select=*`).then((rows) => setRow(rows[0] || null));
  }, [projectId]);

  if (!row) return null;

  const attention = attentionLabel[row.operational_attention] || "In linea";
  const tone = ["blocked", "terna_rejected"].includes(row.operational_attention) ? "pos-critical" : ["urgent", "waiting_terna", "critical", "attention"].includes(row.operational_attention) ? "pos-warning" : "pos-ok";

  return (
    <section className="pos-shell">
      <style>{`.pos-shell{margin:0 0 18px;background:#172b4d;color:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 4px 16px rgba(23,43,77,.12)}.pos-head{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:13px}.pos-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.13em;font-weight:800;opacity:.7}.pos-title{font-size:14px;font-weight:800;margin-top:3px}.pos-badge{border-radius:999px;padding:5px 9px;font-size:9px;font-weight:800}.pos-ok{background:#eaf8f1;color:#18794e}.pos-warning{background:#fff5df;color:#996400}.pos-critical{background:#fff0ef;color:#b43a34}.pos-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.pos-box{background:rgba(255,255,255,.08);border-radius:9px;padding:10px}.pos-box small{display:block;font-size:8px;text-transform:uppercase;opacity:.62}.pos-box b{display:block;font-size:16px;margin-top:4px}.pos-next{margin-top:10px;border-top:1px solid rgba(255,255,255,.12);padding-top:9px;font-size:10px;opacity:.86}@media(max-width:800px){.pos-grid{grid-template-columns:repeat(2,1fr)}.pos-head{align-items:flex-start}}`}</style>
      <div className="pos-head">
        <div><div className="pos-kicker">Controllo operativo</div><div className="pos-title">Cosa richiede attenzione adesso</div></div>
        <span className={`pos-badge ${tone}`}>{attention}</span>
      </div>
      <div className="pos-grid">
        <div className="pos-box"><small>Attività aperte</small><b>{row.open_tasks || 0}</b></div>
        <div className="pos-box"><small>Bloccate</small><b>{row.blockers || 0}</b></div>
        <div className="pos-box"><small>Attività scadute</small><b>{row.overdue_tasks || 0}</b></div>
        <div className="pos-box"><small>Prossima scadenza</small><b>{fmt(row.next_connection_deadline)}</b></div>
        <div className="pos-box"><small>Conferme Terna in attesa</small><b>{row.waiting_terna_confirmations || 0}</b></div>
      </div>
      <div className="pos-next"><b>Prossimo punto di controllo:</b> {row.next_connection_deadline ? `scadenza connessione il ${fmt(row.next_connection_deadline)}` : "nessuna scadenza di connessione registrata"}</div>
    </section>
  );
}
