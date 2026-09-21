"use client";

import { useEffect, useMemo, useState } from "react";

const fmt = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("it-IT") : "—";

export default function ViscontiMeetingNotesHistory() {
  const [meetings, setMeetings] = useState([]);
  const [topics, setTopics] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch("/api/visconti-work/meetings?history=1", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const list = Array.isArray(j.meetings) ? j.meetings : [];
      setMeetings(list);
      setTopics(Array.isArray(j.topics) ? j.topics : []);
      setNotes(Object.fromEntries(list.map((m) => [m.id, m.notes || ""])));
    }
  }

  useEffect(() => { load(); }, []);

  async function save(id) {
    setSavingId(id); setMessage("");
    const r = await fetch("/api/visconti-work/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind: "meeting", notes: notes[id] || "" }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMeetings((items) => items.map((m) => m.id === id ? (j.meeting || m) : m));
      setMessage("Appunti salvati.");
    } else setMessage(j.error || "Impossibile salvare gli appunti.");
    setSavingId(null);
  }

  const topicMap = useMemo(() => topics.reduce((acc, topic) => {
    (acc[topic.meeting_id] ||= []).push(topic);
    return acc;
  }, {}), [topics]);

  if (!meetings.length) return null;

  return <section className="vmnh">
    <style>{`.vmnh{max-width:1450px;margin:14px auto 0;padding:0 34px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172033}.vmnh-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:18px}.vmnh-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.vmnh-kicker{font-size:8px;text-transform:uppercase;letter-spacing:.13em;font-weight:850;color:#7d8797}.vmnh-title{font-size:16px;margin:4px 0}.vmnh-sub{font-size:10px;color:#697487;margin:0}.vmnh-count{font-size:9px;font-weight:800;color:#315ba7;background:#edf3ff;padding:6px 9px;border-radius:999px}.vmnh-list{display:grid;gap:10px;margin-top:14px}.vmnh-row{border:1px solid #e1e5eb;border-radius:11px;overflow:hidden;background:#fbfcfe}.vmnh-row-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 13px;cursor:pointer}.vmnh-name{font-size:11px;font-weight:850}.vmnh-meta{font-size:9px;color:#697487;margin-top:3px}.vmnh-badge{font-size:8px;font-weight:800;padding:5px 8px;border-radius:999px;background:#eef1f5;color:#596579}.vmnh-body{padding:0 13px 13px}.vmnh-label{font-size:8px;text-transform:uppercase;letter-spacing:.1em;font-weight:850;color:#7d8797;margin:10px 0 5px}.vmnh-text{width:100%;min-height:90px;border:1px solid #d8dee7;border-radius:9px;padding:10px;font-size:10px;line-height:1.5;resize:vertical;background:#fff}.vmnh-actions{display:flex;justify-content:flex-end;margin-top:8px}.vmnh-btn{border:1px solid #172b4d;background:#172b4d;color:#fff;border-radius:8px;padding:8px 11px;font-size:9px;font-weight:800;cursor:pointer}.vmnh-topics{display:grid;gap:7px}.vmnh-topic{padding:9px 10px;border:1px solid #e5e8ed;border-radius:8px;background:#fff}.vmnh-topic-title{font-size:10px;font-weight:800}.vmnh-topic-detail{font-size:9px;color:#697487;margin-top:4px;line-height:1.45}.vmnh-msg{margin-top:8px;padding:8px 10px;background:#edf3ff;color:#315ba7;border-radius:8px;font-size:9px;font-weight:750}@media(max-width:700px){.vmnh{padding:0 14px}.vmnh-head,.vmnh-row-head{align-items:flex-start;flex-direction:column}.vmnh-count{align-self:flex-start}}`}</style>
    <div className="vmnh-card">
      <div className="vmnh-head"><div><div className="vmnh-kicker">Archivio riunioni</div><h2 className="vmnh-title">Storico delle riunioni</h2><p className="vmnh-sub">Apri una riunione per rileggere appunti, argomenti, decisioni e lavori discussi.</p></div><div className="vmnh-count">{meetings.length} riunioni</div></div>
      <div className="vmnh-list">
        {meetings.map((meeting) => {
          const items = topicMap[meeting.id] || [];
          const open = openId === meeting.id;
          return <div className="vmnh-row" key={meeting.id}>
            <div className="vmnh-row-head" onClick={() => setOpenId(open ? null : meeting.id)}>
              <div><div className="vmnh-name">{meeting.title || "Riunione operativa"}</div><div className="vmnh-meta">{fmt(meeting.meeting_date)} · {items.length} punti</div></div>
              <div className="vmnh-badge">{meeting.status === "closed" ? "Archiviata" : meeting.status === "in_progress" ? "In corso" : "Bozza"} · {open ? "Chiudi" : "Apri"}</div>
            </div>
            {open && <div className="vmnh-body">
              <div className="vmnh-label">Appunti</div>
              <textarea className="vmnh-text" value={notes[meeting.id] || ""} onChange={(e) => setNotes((current) => ({ ...current, [meeting.id]: e.target.value }))} placeholder="Nessun appunto registrato." />
              <div className="vmnh-actions"><button className="vmnh-btn" onClick={() => save(meeting.id)} disabled={savingId === meeting.id}>{savingId === meeting.id ? "Salvataggio…" : "Salva appunti"}</button></div>
              <div className="vmnh-label">Argomenti della riunione</div>
              {items.length ? <div className="vmnh-topics">{items.map((topic) => <div className="vmnh-topic" key={topic.id}><div className="vmnh-topic-title">{topic.title}</div>{topic.discussion && <div className="vmnh-topic-detail"><b>Discussione:</b> {topic.discussion}</div>}{topic.decision && <div className="vmnh-topic-detail"><b>Decisione:</b> {topic.decision}</div>}{topic.action && <div className="vmnh-topic-detail"><b>Azione:</b> {topic.action}</div>}{topic.due_date && <div className="vmnh-topic-detail"><b>Scadenza:</b> {fmt(topic.due_date)}</div>}</div>)}</div> : <div className="vmnh-topic-detail">Nessun argomento registrato.</div>}
            </div>}
          </div>;
        })}
      </div>
      {message && <div className="vmnh-msg">{message}</div>}
    </div>
  </section>;
}
