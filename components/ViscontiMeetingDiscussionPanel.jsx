"use client";

import { useEffect, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("it-IT") : "—";
const nameOf = (m) => m?.display_name || m?.name || "—";

export default function ViscontiMeetingDiscussionPanel({ projects = [], members = [] }) {
  const [meeting, setMeeting] = useState(null);
  const [topics, setTopics] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState({ discussion: "", decision: "", action: "" });
  const [meetingDraft, setMeetingDraft] = useState({ title: "", meeting_date: today(), notes: "" });
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const projectMap = new Map(projects.map(p => [p.id, p.name || p.project_name || "—"]));
  const memberMap = new Map(members.map(m => [m.id, nameOf(m)]));

  async function load() {
    setLoading(true);
    const r = await fetch("/api/visconti-work/meetings", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMeeting(j.meeting || null);
      setTopics(j.topics || []);
      if (j.meeting) {
        setMeetingDraft({
          title: j.meeting.title || "Riunione operativa",
          meeting_date: String(j.meeting.meeting_date || today()).slice(0, 10),
          notes: j.meeting.notes || "",
        });
      }
    } else {
      setMessage(j.error || "Errore nel caricamento della riunione.");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function editTopic(topic) {
    setOpenId(topic.id);
    setDraft({ discussion: topic.discussion || "", decision: topic.decision || "", action: topic.action || "" });
    setMessage("");
  }

  async function createMeeting(e) {
    e.preventDefault();
    if (meeting) return setMessage("C'è già una riunione attiva. Chiudila prima di crearne una nuova.");
    if (!meetingDraft.title.trim()) return setMessage("Inserisci il titolo della riunione.");
    setSaving(true);
    setMessage("");
    const r = await fetch("/api/visconti-work/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "meeting", title: meetingDraft.title.trim(), meeting_date: meetingDraft.meeting_date }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setShowMeetingForm(false);
      window.location.reload();
    } else {
      setMessage(j.error || "Impossibile creare la riunione.");
    }
    setSaving(false);
  }

  async function saveMeetingData() {
    if (!meeting) return;
    setSaving(true);
    setMessage("");
    const r = await fetch("/api/visconti-work/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: meeting.id,
        kind: "meeting",
        title: meetingDraft.title.trim() || "Riunione operativa",
        meeting_date: meetingDraft.meeting_date,
        notes: meetingDraft.notes,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMeeting(j.meeting || meeting);
      setMessage("Dati della riunione salvati.");
    } else {
      setMessage(j.error || "Impossibile salvare i dati della riunione.");
    }
    setSaving(false);
  }

  async function saveNotes() {
    if (!meeting) return;
    setSaving(true);
    setMessage("");
    const r = await fetch("/api/visconti-work/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: meeting.id, kind: "meeting", notes: meetingDraft.notes }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMeeting(j.meeting || meeting);
      setMessage("Appunti salvati.");
    } else {
      setMessage(j.error || "Impossibile salvare gli appunti.");
    }
    setSaving(false);
  }

  async function saveTopic(id) {
    setSaving(true);
    setMessage("");
    const r = await fetch("/api/visconti-work/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, discussion: draft.discussion, decision: draft.decision, action: draft.action }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setTopics(xs => xs.map(x => x.id === id ? j.topic : x));
      setOpenId(null);
      setMessage("Discussione aggiornata.");
    } else {
      setMessage(j.error || "Impossibile aggiornare il punto.");
    }
    setSaving(false);
  }

  return <section className="vmdp">
    <style>{`
      .vmdp{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:18px;margin:14px 0}.vmdp *{box-sizing:border-box}.vmdp-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.vmdp-kicker{font-size:8px;text-transform:uppercase;letter-spacing:.13em;font-weight:850;color:#7d8797}.vmdp-title{font-size:18px;margin:4px 0;color:#172033}.vmdp-sub{font-size:10px;color:#697487;margin:0;line-height:1.5}.vmdp-count{font-size:9px;font-weight:800;color:#315ba7;background:#edf3ff;padding:6px 9px;border-radius:999px;white-space:nowrap}.vmdp-toolbar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:12px}.vmdp-btn{border:1px solid #d8dee7;background:#fff;color:#172033;border-radius:8px;padding:7px 10px;font-size:9px;font-weight:800;cursor:pointer}.vmdp-primary{background:#172b4d;color:#fff;border-color:#172b4d}.vmdp-form{margin-top:12px;padding:12px;background:#f7f8fa;border:1px solid #e2e6ec;border-radius:11px}.vmdp-formgrid{display:grid;grid-template-columns:1.5fr 180px;gap:8px}.vmdp-input,.vmdp-textarea{width:100%;border:1px solid #d8dee7;background:#fff;border-radius:8px;padding:9px 10px;font-size:10px;color:#172033}.vmdp-textarea{min-height:90px;resize:vertical}.vmdp-notes{margin:14px 0;padding:13px;background:#f7f8fa;border:1px solid #e2e6ec;border-radius:11px}.vmdp-notes-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:7px}.vmdp-notes-title{font-size:11px;font-weight:850;color:#172033}.vmdp-notes-help{font-size:8px;color:#7d8797}.vmdp-empty{padding:16px;border:1px dashed #dce1e8;border-radius:10px;color:#7d8797;font-size:10px;text-align:center}.vmdp-list{display:grid;gap:10px}.vmdp-item{border:1px solid #e1e5eb;border-radius:11px;padding:13px;background:#fafbfc}.vmdp-top{display:flex;justify-content:space-between;gap:12px}.vmdp-top h3{font-size:11px;margin:0;color:#172033}.vmdp-meta{font-size:8px;color:#7d8797;margin-top:4px}.vmdp-cols{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:9px;margin-top:11px}.vmdp-box{background:#fff;border:1px solid #e7eaf0;border-radius:9px;padding:9px}.vmdp-label{display:block;font-size:7px;text-transform:uppercase;font-weight:850;color:#8992a0;margin-bottom:5px}.vmdp-text{font-size:9px;color:#4f5b6d;line-height:1.45;white-space:pre-wrap;min-height:28px}.vmdp-edit{margin-top:10px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px}.vmdp-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:8px}.vmdp-msg{margin-top:10px;padding:8px 10px;background:#edf3ff;border-radius:8px;color:#315ba7;font-size:9px;font-weight:750}@media(max-width:800px){.vmdp-head,.vmdp-top{flex-direction:column}.vmdp-formgrid,.vmdp-cols,.vmdp-edit{grid-template-columns:1fr}.vmdp-count{align-self:flex-start}.vmdp-toolbar{align-items:stretch}.vmdp-toolbar .vmdp-btn{width:100%}}
    `}</style>

    <div className="vmdp-head">
      <div><div className="vmdp-kicker">Verbale operativo</div><h2 className="vmdp-title">Discussione della riunione</h2><p className="vmdp-sub">Per ogni punto: situazione e interventi → decisione → azione conseguente. La traccia resta collegata al progetto e al responsabile.</p></div>
      <div className="vmdp-count">{meeting ? `${topics.length} punti · ${fmt(meeting.meeting_date)}` : "Nessuna riunione attiva"}</div>
    </div>

    <div className="vmdp-toolbar">
      {!meeting && <button className="vmdp-btn vmdp-primary" onClick={() => setShowMeetingForm(v => !v)}>{showMeetingForm ? "Chiudi nuova riunione" : "＋ Nuova riunione"}</button>}
      {meeting && <span className="vmdp-btn" style={{cursor:"default"}}>Riunione attiva · {meeting.title || "Riunione operativa"}</span>}
    </div>

    {!meeting && showMeetingForm && <form className="vmdp-form" onSubmit={createMeeting}>
      <div className="vmdp-formgrid">
        <input className="vmdp-input" value={meetingDraft.title} onChange={e => setMeetingDraft({...meetingDraft, title:e.target.value})} placeholder="Titolo della riunione" />
        <input className="vmdp-input" type="date" value={meetingDraft.meeting_date} onChange={e => setMeetingDraft({...meetingDraft, meeting_date:e.target.value})} />
      </div>
      <div className="vmdp-actions"><button type="button" className="vmdp-btn" onClick={() => setShowMeetingForm(false)}>Annulla</button><button type="submit" className="vmdp-btn vmdp-primary" disabled={saving}>{saving ? "Creazione…" : "Crea riunione"}</button></div>
    </form>}

    {meeting && <>
      <div className="vmdp-notes">
        <div className="vmdp-notes-head"><div><div className="vmdp-notes-title">Appunti della riunione</div><div className="vmdp-notes-help">Spazio libero per note, informazioni, problemi, telefonate e promemoria emersi durante la riunione.</div></div><button className="vmdp-btn vmdp-primary" onClick={saveNotes} disabled={saving}>{saving ? "Salvataggio…" : "Salva appunti"}</button></div>
        <textarea className="vmdp-textarea" value={meetingDraft.notes} onChange={e => setMeetingDraft({...meetingDraft, notes:e.target.value})} placeholder="Scrivi qui gli appunti della riunione…" />
      </div>
    </>}

    {loading ? <div className="vmdp-empty">Caricamento…</div> : topics.length ? <div className="vmdp-list">{topics.map(topic => <article className="vmdp-item" key={topic.id}>
      <div className="vmdp-top"><div><h3>{topic.title || "Punto senza titolo"}</h3><div className="vmdp-meta">{projectMap.get(topic.project_id) || "Nessun progetto"} · {memberMap.get(topic.responsible_id) || "Nessun responsabile"}{topic.due_date ? ` · scadenza ${fmt(topic.due_date)}` : ""}</div></div><button className="vmdp-btn" onClick={() => editTopic(topic)}>{openId === topic.id ? "Modifica in corso" : "Modifica"}</button></div>
      {openId === topic.id ? <>
        <div className="vmdp-edit"><textarea className="vmdp-textarea" placeholder="Situazione, problema, interventi e osservazioni" value={draft.discussion} onChange={e => setDraft({...draft, discussion:e.target.value})}/><textarea className="vmdp-textarea" placeholder="Decisione presa" value={draft.decision} onChange={e => setDraft({...draft, decision:e.target.value})}/><textarea className="vmdp-textarea" placeholder="Azione conseguente" value={draft.action} onChange={e => setDraft({...draft, action:e.target.value})}/></div><div className="vmdp-actions"><button className="vmdp-btn" onClick={() => setOpenId(null)}>Annulla</button><button className="vmdp-btn vmdp-primary" onClick={() => saveTopic(topic.id)} disabled={saving}>{saving ? "Salvataggio…" : "Salva discussione"}</button></div>
      </> : <div className="vmdp-cols"><div className="vmdp-box"><span className="vmdp-label">Discussione / interventi</span><div className="vmdp-text">{topic.discussion || "Non ancora registrata."}</div></div><div className="vmdp-box"><span className="vmdp-label">Decisione</span><div className="vmdp-text">{topic.decision || "—"}</div></div><div className="vmdp-box"><span className="vmdp-label">Azione conseguente</span><div className="vmdp-text">{topic.action || "—"}</div></div></div>}
    </article>)}</div> : <div className="vmdp-empty">Nessun punto registrato. Apri la riunione e aggiungi il primo argomento nella sezione operativa qui sotto.</div>}
    {message && <div className="vmdp-msg">{message}</div>}
  </section>;
}
