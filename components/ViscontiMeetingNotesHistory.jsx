"use client";

import { useEffect, useState } from "react";

const fmt = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("it-IT") : "—";

export default function ViscontiMeetingNotesHistory() {
  const [meeting, setMeeting] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch("/api/visconti-work/meetings?history=1", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMeeting(j.meeting || null);
      setNotes(j.meeting?.notes || "");
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!meeting) return;
    setSaving(true); setMessage("");
    const r = await fetch("/api/visconti-work/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: meeting.id, kind: "meeting", notes }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMeeting(j.meeting || meeting);
      setMessage("Appunti salvati.");
    } else setMessage(j.error || "Impossibile salvare gli appunti.");
    setSaving(false);
  }

  if (!meeting || meeting.status !== "closed") return null;

  return <section className="vmnh">
    <style>{`.vmnh{max-width:1450px;margin:14px auto 0;padding:0 34px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172033}.vmnh-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:18px}.vmnh-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.vmnh-kicker{font-size:8px;text-transform:uppercase;letter-spacing:.13em;font-weight:850;color:#7d8797}.vmnh-title{font-size:16px;margin:4px 0}.vmnh-sub{font-size:10px;color:#697487;margin:0}.vmnh-date{font-size:9px;font-weight:800;color:#315ba7;background:#edf3ff;padding:6px 9px;border-radius:999px}.vmnh-text{width:100%;min-height:100px;margin-top:12px;border:1px solid #d8dee7;border-radius:9px;padding:10px;font-size:10px;line-height:1.5;resize:vertical}.vmnh-actions{display:flex;justify-content:flex-end;margin-top:8px}.vmnh-btn{border:1px solid #172b4d;background:#172b4d;color:#fff;border-radius:8px;padding:8px 11px;font-size:9px;font-weight:800;cursor:pointer}.vmnh-msg{margin-top:8px;padding:8px 10px;background:#edf3ff;color:#315ba7;border-radius:8px;font-size:9px;font-weight:750}@media(max-width:700px){.vmnh{padding:0 14px}.vmnh-head{flex-direction:column}.vmnh-date{align-self:flex-start}}`}</style>
    <div className="vmnh-card">
      <div className="vmnh-head"><div><div className="vmnh-kicker">Storico riunioni</div><h2 className="vmnh-title">Appunti ultima riunione</h2><p className="vmnh-sub">Gli appunti rimangono disponibili anche dopo la chiusura e possono essere corretti.</p></div><div className="vmnh-date">{fmt(meeting.meeting_date)} · archiviata</div></div>
      <textarea className="vmnh-text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nessun appunto registrato." />
      <div className="vmnh-actions"><button className="vmnh-btn" onClick={save} disabled={saving}>{saving ? "Salvataggio…" : "Salva appunti"}</button></div>
      {message && <div className="vmnh-msg">{message}</div>}
    </div>
  </section>;
}
