"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SupabaseClient } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════════════════════
// ICON COMPONENTS (unchanged)
// ═══════════════════════════════════════════════════════════════════════
const Icons = {
  Wind: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>,
  Sun: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  Battery: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 10v4"/><path d="M7 10v4m4-4v4"/></svg>,
  Folder: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 6 9 17l-5-5"/></svg>,
  Alert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4m0 4h.01"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  File: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Euro: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M18 8.5a6.5 6.5 0 0 0-12 0v3a6.5 6.5 0 0 0 12 4M4 10h10M4 14h8"/></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 5v14m-7-7h14"/></svg>,
  ChevRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="m9 18 6-6-6-6"/></svg>,
  ChevLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="m15 18-6-6 6-6"/></svg>,
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Plane: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
  Zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Building: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4m-4 4h4m-4 4h4m-4 4h4"/></svg>,
  Gear: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  MapPin: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Tasks: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════════
// DESIGN TOKENS (unchanged)
// ═══════════════════════════════════════════════════════════════════════
const T = {
  bg: "#0c0f14", surface: "#141820", surfaceAlt: "#1a1f2b",
  border: "#242a38", borderLight: "#2d3548",
  text: "#e8ecf4", textMuted: "#7a839a", textDim: "#4d566e",
  accent: "#3b82f6", accentGlow: "rgba(59,130,246,0.15)",
  green: "#10b981", greenBg: "rgba(16,185,129,0.12)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.12)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.12)",
  purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.12)",
  cyan: "#06b6d4", cyanBg: "rgba(6,182,212,0.12)",
  wind: "#06b6d4", solar: "#f59e0b", bess: "#8b5cf6",
};

const typeColors = { wind: T.wind, "agro-pv": T.solar, storage: T.bess };
const typeLabels = { wind: "Eolico", "agro-pv": "Agrivoltaico", storage: "BESS" };
const typeIcons = { wind: Icons.Wind, "agro-pv": Icons.Sun, storage: Icons.Battery };


// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
function statusColor(s) {
  return { Autorizzazione:"blue", Connessione:"amber", VIA:"blue", "Da Perfezionare":"red", Progettazione:"purple", "SPV Attiva":"green", Terreni:"amber", Aviation:"amber" }[s] || "blue";
}
function progressColor(p) { return p >= 70 ? T.green : p >= 40 ? T.amber : T.accent; }
function StatusBadge({ status, size }) { return <span className={`status-dot ${statusColor(status)}`} style={size === "small" ? { fontSize:11 } : {}}>{status}</span>; }
function TypeBadge({ type }) { const I = typeIcons[type]; return <span className={`type-badge ${type}`}><I /> {typeLabels[type]}</span>; }
function PhaseTracker({ phases, activeIndex }) {
  return <div className="phase-tracker">{phases.map((p,i) => { const st = i < activeIndex ? "done" : i === activeIndex ? "active" : ""; return <div key={i} className={`phase-step ${st}`}>{i < phases.length - 1 && <div className="step-line"/>}<div className="step-dot">{i < activeIndex ? <Icons.Check/> : i+1}</div><div className="step-label">{p}</div></div>; })}</div>;
}
function DocRow({ name, date }) { return <div className="doc-row"><span className="doc-icon"><Icons.File/></span><span className="doc-name">{name}</span><span className="doc-date">{date}</span></div>; }

// ═══════════════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════════════════════
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  const el = <div className="toast-container">{toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}</div>;
  return { toast: add, ToastContainer: el };
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SETUP SCREEN (Supabase connection)
// ═══════════════════════════════════════════════════════════════════════
function SetupScreen({ onConnect }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;
  const didAutoConnect = useRef(false);

  // Auto-connect from env vars or previous session — runs ONCE
  useEffect(() => {
    if (didAutoConnect.current) return;
    didAutoConnect.current = true;

    const envUrl = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) || "";
    const envKey = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || "";
    const cachedUrl = typeof window !== "undefined" ? window.__SB_URL || "" : "";
    const cachedKey = typeof window !== "undefined" ? window.__SB_KEY || "" : "";
    const u = envUrl || cachedUrl;
    const k = envKey || cachedKey;
    if (u) setUrl(u);
    if (k) setKey(k);
    if (u && k) {
      (async () => {
        setTesting(true);
        try {
          const client = new SupabaseClient(u, k);
          await client.from("projects").select("id").execute();
          if (typeof window !== "undefined") { window.__SB_URL = u; window.__SB_KEY = k; }
          onConnectRef.current(client);
        } catch (e) {
          console.error("Auto-connect failed:", e);
          setTesting(false);
          setStatus("error");
        }
      })();
    }
  }, []); // intentionally empty — ref handles callback

  const handleConnect = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const client = new SupabaseClient(url.trim(), key.trim());
      await client.from("projects").select("id").execute();
      setStatus("connected");
      if (typeof window !== "undefined") { window.__SB_URL = url.trim(); window.__SB_KEY = key.trim(); }
      setTimeout(() => onConnect(client), 600);
    } catch (e) {
      setStatus("error");
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="setup-screen">
      <div className="setup-card fade-in">
        <div style={{ color: T.accent }}><Icons.Database /></div>
        <h2>Connetti a Supabase</h2>
        <p>Inserisci le credenziali del tuo progetto Supabase.<br/>Le trovi in Settings → API nel dashboard Supabase.</p>
        <div className="form-group">
          <label className="form-label">Project URL</label>
          <input className="form-input" placeholder="https://xxxxx.supabase.co" value={url} onChange={e => setUrl(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Anon / Public Key</label>
          <input className="form-input" placeholder="eyJhbGciOi..." value={key} onChange={e => setKey(e.target.value)} type="password" />
        </div>
        {status === "connected" && <div className="conn-status connected"><Icons.Check /> Connesso con successo</div>}
        {status === "error" && <div className="conn-status error"><Icons.Alert /> Connessione fallita — controlla URL e chiave</div>}
        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConnect} disabled={testing || !url || !key}>
            {testing ? <><span className="spinner spinner-sm" /> Connessione...</> : "Connetti"}
          </button>
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
          Assicurati di aver eseguito lo schema SQL nel tuo Supabase SQL Editor prima di connetterti.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PROJECT FORM MODAL
// ═══════════════════════════════════════════════════════════════════════
function ProjectFormModal({ project, onSave, onClose, saving }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: project?.name || "",
    type: project?.type || "wind",
    mw: project?.mw || "",
    region: project?.region || "",
    status: project?.status || "Terreni",
    phase: project?.phase || "land",
    completion: project?.completion || 0,
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const STATUSES = ["Terreni", "Connessione", "VIA", "Autorizzazione", "Da Perfezionare", "Progettazione", "SPV Attiva", "Aviation"];
  const PHASES = ["land", "connection", "aviation", "authorization", "design", "spv", "accounting"];

  return (
    <Modal
      title={isEdit ? "Modifica Progetto" : "Nuovo Progetto"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving || !form.name}>
            {saving ? <><span className="spinner spinner-sm" /> Salvataggio...</> : isEdit ? "Salva Modifiche" : "Crea Progetto"}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Nome Progetto</label>
        <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="es. Foggia Agri-PV" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-input form-select" value={form.type} onChange={e => set("type", e.target.value)}>
            <option value="wind">Eolico</option>
            <option value="agro-pv">Agrivoltaico</option>
            <option value="storage">BESS</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">MW</label>
          <input className="form-input" type="number" value={form.mw} onChange={e => set("mw", e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Regione</label>
          <input className="form-input" value={form.region} onChange={e => set("region", e.target.value)} placeholder="es. Puglia" />
        </div>
        <div className="form-group">
          <label className="form-label">Completamento %</label>
          <input className="form-input" type="number" min="0" max="100" value={form.completion} onChange={e => set("completion", e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Stato</label>
          <select className="form-input form-select" value={form.status} onChange={e => set("status", e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Fase</label>
          <select className="form-input form-select" value={form.phase} onChange={e => set("phase", e.target.value)}>
            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TASK FORM MODAL
// ═══════════════════════════════════════════════════════════════════════
function TaskFormModal({ projects, projectId, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    project_id: projectId || projects[0]?.id || "",
    title: "",
    assignee: "",
    status: "pending",
    deadline: "",
    entity: "Terreni",
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const ENTITIES = ["Terreni", "Connessione", "Aviation", "Autorizzazione", "Progettazione", "SPV", "Contabilità"];

  return (
    <Modal
      title="Nuovo Task"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving || !form.title}>
            {saving ? <><span className="spinner spinner-sm"/> Salvataggio...</> : "Crea Task"}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Progetto</label>
        <select className="form-input form-select" value={form.project_id} onChange={e => set("project_id", e.target.value)}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Titolo Task</label>
        <input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="es. Richiedere CDU..." />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Assegnato a</label>
          <input className="form-input" value={form.assignee} onChange={e => set("assignee", e.target.value)} placeholder="es. Federica M." />
        </div>
        <div className="form-group">
          <label className="form-label">Entità</label>
          <select className="form-input form-select" value={form.entity} onChange={e => set("entity", e.target.value)}>
            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Scadenza</label>
          <input className="form-input" type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Stato</label>
          <select className="form-input form-select" value={form.status} onChange={e => set("status", e.target.value)}>
            <option value="pending">Da fare</option>
            <option value="in_progress">In corso</option>
            <option value="done">Completato</option>
            <option value="overdue">In ritardo</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONFIRM DELETE MODAL
// ═══════════════════════════════════════════════════════════════════════
function ConfirmModal({ title, message, onConfirm, onClose, confirming }) {
  return (
    <Modal title={title} onClose={onClose} footer={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={confirming}>
          {confirming ? <><span className="spinner spinner-sm"/> Eliminazione...</> : "Elimina"}
        </button>
      </>
    }>
      <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PARCEL FORM MODAL
// ═══════════════════════════════════════════════════════════════════════
function ParcelFormModal({ parcel, onSave, onClose, saving }) {
  const isEdit = !!parcel;
  const [form, setForm] = useState({
    foglio: parcel?.foglio || "",
    particella: parcel?.particella || "",
    owner: parcel?.owner || "",
    area: parcel?.area || "",
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <Modal title={isEdit ? "Modifica Parcella" : "Nuova Parcella"} onClose={onClose} footer={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving || !form.foglio || !form.particella}>
          {saving ? <><span className="spinner spinner-sm"/> Salvataggio...</> : isEdit ? "Salva Modifiche" : "Crea Parcella"}
        </button>
      </>
    }>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Foglio</label><input className="form-input" value={form.foglio} onChange={e => set("foglio", e.target.value)} placeholder="es. 12" /></div>
        <div className="form-group"><label className="form-label">Particella</label><input className="form-input" value={form.particella} onChange={e => set("particella", e.target.value)} placeholder="es. 234" /></div>
      </div>
      <div className="form-group"><label className="form-label">Proprietario</label><input className="form-input" value={form.owner} onChange={e => set("owner", e.target.value)} placeholder="es. Rossi Mario" /></div>
      <div className="form-group"><label className="form-label">Superficie</label><input className="form-input" value={form.area} onChange={e => set("area", e.target.value)} placeholder="es. 12.500 m²" /></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CHECK FORM MODAL
// ═══════════════════════════════════════════════════════════════════════
function CheckFormModal({ check, parcelLabel, onSave, onClose, saving }) {
  const isEdit = !!check;
  const [form, setForm] = useState({
    type: check?.type || "CDU",
    status: check?.status || "pending",
    request_date: check?.request_date || "",
    response_date: check?.response_date || "",
    payment_proof: check?.payment_proof || "",
    document_url: check?.document_url || "",
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const CHECK_LABELS = { CDU: "CDU", usi_civici: "Usi Civici", aree_fuoco: "Aree Percorse da Fuoco" };
  return (
    <Modal title={isEdit ? `Modifica Verifica – ${parcelLabel}` : `Nuova Verifica – ${parcelLabel}`} onClose={onClose} footer={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? <><span className="spinner spinner-sm"/> Salvataggio...</> : isEdit ? "Salva Modifiche" : "Crea Verifica"}
        </button>
      </>
    }>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tipo Verifica</label>
          <select className="form-input form-select" value={form.type} onChange={e => set("type", e.target.value)} disabled={isEdit}>
            {Object.entries(CHECK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Stato</label>
          <select className="form-input form-select" value={form.status} onChange={e => set("status", e.target.value)}>
            <option value="pending">Da fare</option>
            <option value="in_progress">In corso</option>
            <option value="done">Completato</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Data Richiesta</label><input className="form-input" type="date" value={form.request_date} onChange={e => set("request_date", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Data Risposta</label><input className="form-input" type="date" value={form.response_date} onChange={e => set("response_date", e.target.value)} /></div>
      </div>
      <div className="form-group"><label className="form-label">Prova di Pagamento</label><input className="form-input" value={form.payment_proof} onChange={e => set("payment_proof", e.target.value)} placeholder="es. Bonifico €35,00 / PagoPA €16,00" /></div>
      <div className="form-group"><label className="form-label">Documento (nome file)</label><input className="form-input" value={form.document_url} onChange={e => set("document_url", e.target.value)} placeholder="es. CDU_F12_P234.pdf" /></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB: LAND (TERRENI) — fully dynamic from Supabase
// ═══════════════════════════════════════════════════════════════════════
function TabLand({ db, projectId, toast }) {
  const [parcels, setParcels] = useState([]);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedParcel, setExpandedParcel] = useState(null);

  const CHECK_LABELS = { CDU: "CDU", usi_civici: "Usi Civici", aree_fuoco: "Aree Percorse da Fuoco" };
  const cs = s => s === "done" ? { l: "Completato", c: "done" } : s === "in_progress" ? { l: "In corso", c: "active" } : { l: "Da fare", c: "pending" };
  const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  // ── Fetch parcels + checks ──
  const fetchLand = useCallback(async () => {
    setLoading(true);
    try {
      const p = await db.from("land_parcels").eq("project_id", projectId).order("created_at").execute();
      setParcels(p || []);
      if (p && p.length > 0) {
        const parcelIds = p.map(x => x.id);
        const allChecks = [];
        for (const pid of parcelIds) {
          const c = await db.from("land_checks").eq("parcel_id", pid).order("type").execute();
          if (c) allChecks.push(...c);
        }
        setChecks(allChecks);
      } else {
        setChecks([]);
      }
    } catch (e) {
      toast("Errore caricamento terreni: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [db, projectId, toast]);

  useEffect(() => { fetchLand(); }, [fetchLand]);

  // ── Get check status for a parcel and type ──
  const getCheck = (parcelId, type) => checks.find(c => c.parcel_id === parcelId && c.type === type);
  const getCheckStatus = (parcelId, type) => {
    const c = getCheck(parcelId, type);
    return c ? cs(c.status) : { l: "N/A", c: "pending" };
  };

  // ── CRUD: Parcels ──
  const handleSaveParcel = async (form) => {
    setSaving(true);
    try {
      if (modal.parcel) {
        await db.from("land_parcels").eq("id", modal.parcel.id).update(form);
        toast("Parcella aggiornata");
      } else {
        const inserted = await db.from("land_parcels").insert({ ...form, project_id: projectId });
        if (inserted && inserted[0]) {
          const newId = inserted[0].id;
          await db.from("land_checks").insert([
            { parcel_id: newId, type: "CDU", status: "pending" },
            { parcel_id: newId, type: "usi_civici", status: "pending" },
            { parcel_id: newId, type: "aree_fuoco", status: "pending" },
          ]);
        }
        toast("Parcella creata con 3 verifiche");
      }
      setModal(null);
      await fetchLand();
    } catch (e) { toast("Errore: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDeleteParcel = async (parcel) => {
    setSaving(true);
    try {
      await db.from("land_parcels").eq("id", parcel.id).delete();
      toast("Parcella eliminata");
      if (expandedParcel === parcel.id) setExpandedParcel(null);
      await fetchLand();
    } catch (e) { toast("Errore: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  // ── CRUD: Checks ──
  const handleSaveCheck = async (form) => {
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.request_date) data.request_date = null;
      if (!data.response_date) data.response_date = null;
      if (modal.check) {
        await db.from("land_checks").eq("id", modal.check.id).update(data);
        toast("Verifica aggiornata");
      } else {
        await db.from("land_checks").insert({ ...data, parcel_id: modal.parcelId });
        toast("Verifica creata");
      }
      setModal(null);
      await fetchLand();
    } catch (e) { toast("Errore: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleCycleCheckStatus = async (check) => {
    const cycle = { pending: "in_progress", in_progress: "done", done: "pending" };
    try {
      await db.from("land_checks").eq("id", check.id).update({ status: cycle[check.status] || "pending" });
      await fetchLand();
    } catch (e) { toast("Errore: " + e.message, "error"); }
  };

  const parcelLabel = (p) => `F.${p.foglio} P.${p.particella}`;
  const checksForParcel = (pid) => checks.filter(c => c.parcel_id === pid);

  return (
    <div className="fade-in" style={{ position: "relative" }}>
      {loading && <div className="loading-overlay"><span className="spinner" /></div>}

      {/* Modals */}
      {modal?.type === "parcel-form" && (
        <ParcelFormModal parcel={modal.parcel} onSave={handleSaveParcel} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === "check-form" && (
        <CheckFormModal check={modal.check} parcelLabel={modal.parcelLabel} onSave={handleSaveCheck} onClose={() => setModal(null)} saving={saving} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}><Icons.MapPin /> Parcelle Catastali</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchLand}><Icons.Refresh /> Aggiorna</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: "parcel-form" })}><Icons.Plus /> Nuova Parcella</button>
        </div>
      </div>

      {/* Parcels Table */}
      <div className="table-container" style={{ marginBottom: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Foglio / Part.</th>
              <th>Proprietario</th>
              <th>Superficie</th>
              <th>CDU</th>
              <th>Usi Civici</th>
              <th>Aree Fuoco</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parcels.map(p => (
              <tr key={p.id} onClick={() => setExpandedParcel(expandedParcel === p.id ? null : p.id)} style={{ cursor: "pointer" }}>
                <td style={{ fontFamily: "'JetBrains Mono'", fontSize: 12 }}>{parcelLabel(p)}</td>
                <td>{p.owner}</td>
                <td style={{ fontFamily: "'JetBrains Mono'", fontSize: 12 }}>{p.area}</td>
                <td>
                  <span className={`mini-badge ${getCheckStatus(p.id, "CDU").c}`} onClick={e => { e.stopPropagation(); const ch = getCheck(p.id, "CDU"); if (ch) handleCycleCheckStatus(ch); }} style={{ cursor: "pointer" }}>
                    {getCheckStatus(p.id, "CDU").l}
                  </span>
                </td>
                <td>
                  <span className={`mini-badge ${getCheckStatus(p.id, "usi_civici").c}`} onClick={e => { e.stopPropagation(); const ch = getCheck(p.id, "usi_civici"); if (ch) handleCycleCheckStatus(ch); }} style={{ cursor: "pointer" }}>
                    {getCheckStatus(p.id, "usi_civici").l}
                  </span>
                </td>
                <td>
                  <span className={`mini-badge ${getCheckStatus(p.id, "aree_fuoco").c}`} onClick={e => { e.stopPropagation(); const ch = getCheck(p.id, "aree_fuoco"); if (ch) handleCycleCheckStatus(ch); }} style={{ cursor: "pointer" }}>
                    {getCheckStatus(p.id, "aree_fuoco").l}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="row-action-btn" onClick={e => { e.stopPropagation(); setModal({ type: "parcel-form", parcel: p }); }} title="Modifica"><Icons.Edit /></button>
                    <button className="row-action-btn danger" onClick={e => { e.stopPropagation(); handleDeleteParcel(p); }} title="Elimina"><Icons.Trash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {parcels.length === 0 && !loading && (
          <div style={{ padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>
            Nessuna parcella registrata. Aggiungi la prima parcella catastale.
          </div>
        )}
      </div>

      {/* Expanded Parcel Detail — Checks */}
      {expandedParcel && (() => {
        const p = parcels.find(x => x.id === expandedParcel);
        if (!p) return null;
        const pChecks = checksForParcel(p.id);
        return (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="section-title" style={{ margin: 0 }}>
                Verifiche – {parcelLabel(p)} <span style={{ fontWeight: 400, color: T.textMuted, fontSize: 12, marginLeft: 8 }}>{p.owner}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: "check-form", parcelId: p.id, parcelLabel: parcelLabel(p) })}><Icons.Plus /> Nuova Verifica</button>
            </div>
            <div className="detail-grid">
              {pChecks.length === 0 && (
                <div className="detail-card">
                  <p style={{ fontSize: 12, color: T.textDim }}>Nessuna verifica. Clicca "Nuova Verifica" per aggiungerne una.</p>
                </div>
              )}
              {pChecks.map(ch => (
                <div className="detail-card" key={ch.id}>
                  <h4>
                    {CHECK_LABELS[ch.type] || ch.type} – {parcelLabel(p)}
                    <span className={`mini-badge ${cs(ch.status).c}`}>{cs(ch.status).l}</span>
                  </h4>
                  <div className="detail-row"><span className="label">Data richiesta</span><span className="value">{fmtDate(ch.request_date)}</span></div>
                  <div className="detail-row"><span className="label">Data risposta</span><span className="value" style={{ color: ch.response_date ? T.text : T.amber }}>{ch.response_date ? fmtDate(ch.response_date) : "In attesa"}</span></div>
                  <div className="detail-row"><span className="label">Pagamento</span><span className="value">{ch.payment_proof || "—"}</span></div>
                  {ch.document_url && <DocRow name={ch.document_url} date={ch.response_date ? fmtDate(ch.response_date).slice(0, 5) : ""} />}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button className="upload-btn" onClick={() => setModal({ type: "check-form", check: ch, parcelId: p.id, parcelLabel: parcelLabel(p) })}><Icons.Edit /> Modifica</button>
                    <button className="upload-btn" onClick={() => handleCycleCheckStatus(ch)} style={{ borderColor: T.green, color: T.green }}>
                      <Icons.Refresh /> Cicla stato
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Summary KPIs */}
      {parcels.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <div className="kpi-card green" style={{ flex: 1 }}>
            <div className="kpi-label">Verifiche Completate</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{checks.filter(c => c.status === "done").length}</div>
            <div className="kpi-sub">su {checks.length} totali</div>
          </div>
          <div className="kpi-card amber" style={{ flex: 1 }}>
            <div className="kpi-label">In Corso</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{checks.filter(c => c.status === "in_progress").length}</div>
          </div>
          <div className="kpi-card red" style={{ flex: 1 }}>
            <div className="kpi-label">Da Fare</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{checks.filter(c => c.status === "pending").length}</div>
          </div>
          <div className="kpi-card blue" style={{ flex: 1 }}>
            <div className="kpi-label">Parcelle Totali</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{parcels.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONNECTION PRACTICE FORM MODAL
// ═══════════════════════════════════════════════════════════════════════
function PracticeFormModal({ practice, onSave, onClose, saving }) {
  const isEdit = !!practice;
  const [form, setForm] = useState({
    operator: practice?.operator || "terna",
    practice_code: practice?.practice_code || "",
    power_mw: practice?.power_mw || "",
    station: practice?.station || "",
    status: practice?.status || "pending",
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const OPERATOR_LABELS = { terna: "Terna S.p.A.", "e-distribuzione": "E-Distribuzione" };
  return (
    <Modal title={isEdit ? "Modifica Pratica Connessione" : "Nuova Pratica Connessione"} onClose={onClose} footer={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving || !form.practice_code}>
          {saving ? <><span className="spinner spinner-sm"/> Salvataggio...</> : isEdit ? "Salva Modifiche" : "Crea Pratica"}
        </button>
      </>
    }>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Operatore</label>
          <select className="form-input form-select" value={form.operator} onChange={e => set("operator", e.target.value)}>
            {Object.entries(OPERATOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Codice Pratica</label>
          <input className="form-input" value={form.practice_code} onChange={e => set("practice_code", e.target.value)} placeholder="es. 202400832" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Potenza (MW)</label>
          <input className="form-input" type="number" value={form.power_mw} onChange={e => set("power_mw", e.target.value)} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Stazione / Cabina</label>
          <input className="form-input" value={form.station} onChange={e => set("station", e.target.value)} placeholder="es. SE Ascoli 150kV" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Stato Pratica</label>
        <select className="form-input form-select" value={form.status} onChange={e => set("status", e.target.value)}>
          <option value="pending">In attesa</option>
          <option value="active">Attiva</option>
          <option value="accepted">Accettata</option>
        </select>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONNECTION STEP FORM MODAL
// ═══════════════════════════════════════════════════════════════════════
function StepFormModal({ step, onSave, onClose, saving }) {
  const isEdit = !!step;
  const PHASE_LABELS = { richiesta: "Richiesta connessione", invio_doc: "Invio documentazione", pto: "PTO – Preventivo", pto_accepted: "PTO Approvato", sharing: "Sharing Agreement", accettazione: "Accettazione" };
  const [form, setForm] = useState({
    phase: step?.phase || "richiesta",
    status: step?.status || "pending",
    completed_date: step?.completed_date || "",
    document: step?.document || "",
    payment_proof: step?.payment_proof || "",
    notes: step?.notes || "",
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <Modal title={isEdit ? `Modifica Fase – ${PHASE_LABELS[step.phase] || step.phase}` : "Nuova Fase"} onClose={onClose} footer={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? <><span className="spinner spinner-sm"/> Salvataggio...</> : isEdit ? "Salva Modifiche" : "Crea Fase"}
        </button>
      </>
    }>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fase</label>
          <select className="form-input form-select" value={form.phase} onChange={e => set("phase", e.target.value)} disabled={isEdit}>
            {Object.entries(PHASE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Stato</label>
          <select className="form-input form-select" value={form.status} onChange={e => set("status", e.target.value)}>
            <option value="pending">Da fare</option>
            <option value="in_progress">In corso</option>
            <option value="done">Completato</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Data completamento</label>
        <input className="form-input" type="date" value={form.completed_date} onChange={e => set("completed_date", e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Documento (nome file)</label>
        <input className="form-input" value={form.document} onChange={e => set("document", e.target.value)} placeholder="es. STMG_Ascoli.pdf" />
      </div>
      <div className="form-group">
        <label className="form-label">Prova di Pagamento</label>
        <input className="form-input" value={form.payment_proof} onChange={e => set("payment_proof", e.target.value)} placeholder="es. Bonifico €5.000" />
      </div>
      <div className="form-group">
        <label className="form-label">Note</label>
        <input className="form-input" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Dettagli aggiuntivi..." />
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB: CONNECTION (CONNESSIONE) — fully dynamic from Supabase
// ═══════════════════════════════════════════════════════════════════════
function TabConnection({ db, projectId, toast }) {
  const [practice, setPractice] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);

  const PHASE_LABELS = { richiesta: "Richiesta", invio_doc: "Invio doc.", pto: "PTO", pto_accepted: "PTO Approv.", sharing: "Sharing", accettazione: "Accettazione" };
  const PHASE_LABELS_FULL = { richiesta: "Richiesta connessione", invio_doc: "Invio documentazione", pto: "PTO – Preventivo", pto_accepted: "PTO Approvato", sharing: "Sharing Agreement", accettazione: "Accettazione" };
  const PHASE_ORDER = ["richiesta", "invio_doc", "pto", "pto_accepted", "sharing", "accettazione"];
  const OPERATOR_LABELS = { terna: "Terna S.p.A.", "e-distribuzione": "E-Distribuzione" };
  const PRACTICE_STATUS_LABELS = { pending: "In attesa", active: "Attiva", accepted: "Accettata" };
  const PRACTICE_STATUS_CLS = { pending: "pending", active: "active", accepted: "done" };

  const cs = s => s === "done" ? { l: "Completato", c: "done" } : s === "in_progress" ? { l: "In corso", c: "active" } : { l: "Da fare", c: "pending" };
  const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  // ── Fetch practice + steps ──
  const fetchConnection = useCallback(async () => {
    setLoading(true);
    try {
      const practices = await db.from("connection_practices").eq("project_id", projectId).execute();
      if (practices && practices.length > 0) {
        const p = practices[0];
        setPractice(p);
        const s = await db.from("connection_steps").eq("practice_id", p.id).execute();
        const sorted = (s || []).sort((a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase));
        setSteps(sorted);
      } else {
        setPractice(null);
        setSteps([]);
      }
    } catch (e) {
      toast("Errore caricamento connessione: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [db, projectId, toast]);

  useEffect(() => { fetchConnection(); }, [fetchConnection]);

  // ── Compute active phase index for PhaseTracker ──
  const activePhaseIndex = (() => {
    if (steps.length === 0) return 0;
    const firstNotDone = steps.findIndex(s => s.status !== "done");
    if (firstNotDone === -1) return steps.length;
    return firstNotDone;
  })();

  // ── CRUD: Practice ──
  const handleSavePractice = async (form) => {
    setSaving(true);
    try {
      const data = { ...form, power_mw: Number(form.power_mw) || 0 };
      if (practice) {
        await db.from("connection_practices").eq("id", practice.id).update(data);
        toast("Pratica aggiornata");
      } else {
        const inserted = await db.from("connection_practices").insert({ ...data, project_id: projectId });
        if (inserted && inserted[0]) {
          const newId = inserted[0].id;
          const seedSteps = PHASE_ORDER.map(phase => ({ practice_id: newId, phase, status: "pending" }));
          await db.from("connection_steps").insert(seedSteps);
        }
        toast("Pratica creata con 6 fasi");
      }
      setModal(null);
      await fetchConnection();
    } catch (e) { toast("Errore: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDeletePractice = async () => {
    setSaving(true);
    try {
      await db.from("connection_practices").eq("id", practice.id).delete();
      toast("Pratica eliminata");
      setPractice(null);
      setSteps([]);
      setModal(null);
    } catch (e) { toast("Errore: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  // ── CRUD: Steps ──
  const handleSaveStep = async (form) => {
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.completed_date) data.completed_date = null;
      if (modal.step) {
        await db.from("connection_steps").eq("id", modal.step.id).update(data);
        toast("Fase aggiornata");
      } else {
        await db.from("connection_steps").insert({ ...data, practice_id: practice.id });
        toast("Fase creata");
      }
      setModal(null);
      await fetchConnection();
    } catch (e) { toast("Errore: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleCycleStepStatus = async (step) => {
    const cycle = { pending: "in_progress", in_progress: "done", done: "pending" };
    const newStatus = cycle[step.status] || "pending";
    try {
      const update = { status: newStatus };
      if (newStatus === "done" && !step.completed_date) {
        update.completed_date = new Date().toISOString().split("T")[0];
      }
      if (newStatus === "pending") {
        update.completed_date = null;
      }
      await db.from("connection_steps").eq("id", step.id).update(update);
      await fetchConnection();
    } catch (e) { toast("Errore: " + e.message, "error"); }
  };

  return (
    <div className="fade-in" style={{ position: "relative" }}>
      {loading && <div className="loading-overlay"><span className="spinner" /></div>}

      {/* Modals */}
      {modal?.type === "practice-form" && (
        <PracticeFormModal practice={modal.practice} onSave={handleSavePractice} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === "step-form" && (
        <StepFormModal step={modal.step} onSave={handleSaveStep} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === "confirm-delete-practice" && (
        <Modal title="Elimina Pratica" onClose={() => setModal(null)} footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Annulla</button>
            <button className="btn btn-danger" onClick={handleDeletePractice} disabled={saving}>
              {saving ? <><span className="spinner spinner-sm"/> Eliminazione...</> : "Elimina Pratica"}
            </button>
          </>
        }>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>Sei sicuro di voler eliminare questa pratica di connessione? Tutte le fasi collegate saranno eliminate (CASCADE).</p>
        </Modal>
      )}

      {/* ── No practice yet ── */}
      {!practice && !loading && (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ color: T.textDim, marginBottom: 16 }}><Icons.Zap /></div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nessuna pratica di connessione</h3>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>Crea una pratica per tracciare l'iter di connessione alla rete.</p>
          <button className="btn btn-primary" onClick={() => setModal({ type: "practice-form" })}><Icons.Plus /> Nuova Pratica</button>
        </div>
      )}

      {/* ── Practice exists ── */}
      {practice && (
        <>
          {/* Practice info card */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0 }}><Icons.Zap /> Pratica di Connessione</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={fetchConnection}><Icons.Refresh /> Aggiorna</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: "practice-form", practice })}><Icons.Edit /> Modifica</button>
              <button className="btn btn-danger btn-sm" onClick={() => setModal({ type: "confirm-delete-practice" })}><Icons.Trash /> Elimina</button>
            </div>
          </div>

          <div className="detail-grid" style={{ marginBottom: 24 }}>
            <div className="detail-card">
              <h4>Informazioni Connessione <span className={`mini-badge ${PRACTICE_STATUS_CLS[practice.status]}`}>{PRACTICE_STATUS_LABELS[practice.status]}</span></h4>
              <div className="detail-row"><span className="label">Operatore</span><span className="value">{OPERATOR_LABELS[practice.operator] || practice.operator}</span></div>
              <div className="detail-row"><span className="label">Codice pratica</span><span className="value" style={{ fontFamily: "'JetBrains Mono'" }}>{practice.practice_code}</span></div>
              <div className="detail-row"><span className="label">Potenza richiesta</span><span className="value">{practice.power_mw} MW</span></div>
              <div className="detail-row"><span className="label">Stazione / Cabina</span><span className="value">{practice.station || "—"}</span></div>
            </div>
            <div className="detail-card">
              <h4>Riepilogo Avanzamento</h4>
              <div className="detail-row"><span className="label">Fasi completate</span><span className="value" style={{ color: T.green }}>{steps.filter(s => s.status === "done").length} / {steps.length}</span></div>
              <div className="detail-row"><span className="label">Fasi in corso</span><span className="value" style={{ color: T.accent }}>{steps.filter(s => s.status === "in_progress").length}</span></div>
              <div className="detail-row"><span className="label">Fasi da fare</span><span className="value" style={{ color: T.textDim }}>{steps.filter(s => s.status === "pending").length}</span></div>
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar" style={{ width: "100%", height: 6 }}>
                  <div className="progress-fill" style={{ width: `${steps.length > 0 ? (steps.filter(s => s.status === "done").length / steps.length * 100) : 0}%`, background: T.green }} />
                </div>
              </div>
            </div>
          </div>

          {/* Phase Tracker */}
          <div className="section-title">Avanzamento Fasi</div>
          <PhaseTracker phases={PHASE_ORDER.map(p => PHASE_LABELS[p])} activeIndex={activePhaseIndex} />

          <div style={{ height: 8 }} />

          {/* Steps detail table */}
          <div className="table-container" style={{ marginBottom: 24 }}>
            <div className="table-header">
              <h3>Dettaglio Fasi</h3>
              <span style={{ fontSize: 11, color: T.textDim }}>Clicca lo stato per ciclare · Clicca la riga per espandere</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Fase</th>
                  <th>Stato</th>
                  <th>Data</th>
                  <th>Documento</th>
                  <th>Pagamento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {steps.map(step => (
                  <tr key={step.id} onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)} style={{ cursor: "pointer" }}>
                    <td style={{ fontWeight: 500 }}>{PHASE_LABELS_FULL[step.phase] || step.phase}</td>
                    <td>
                      <span className={`mini-badge ${cs(step.status).c}`} onClick={e => { e.stopPropagation(); handleCycleStepStatus(step); }} style={{ cursor: "pointer" }}>
                        {cs(step.status).l}
                      </span>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{fmtDate(step.completed_date)}</td>
                    <td>{step.document ? <span style={{ color: T.accent, fontSize: 12 }}><Icons.File /> {step.document}</span> : <span style={{ color: T.textDim, fontSize: 11 }}>—</span>}</td>
                    <td style={{ fontSize: 11, color: step.payment_proof ? T.green : T.textDim }}>{step.payment_proof || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="row-action-btn" onClick={e => { e.stopPropagation(); setModal({ type: "step-form", step }); }} title="Modifica"><Icons.Edit /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {steps.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: T.textDim, fontSize: 13 }}>Nessuna fase registrata.</div>
            )}
          </div>

          {/* Expanded step detail */}
          {expandedStep && (() => {
            const step = steps.find(s => s.id === expandedStep);
            if (!step) return null;
            return (
              <div className="fade-in" style={{ marginBottom: 24 }}>
                <div className="detail-grid">
                  <div className="detail-card">
                    <h4>
                      {PHASE_LABELS_FULL[step.phase] || step.phase}
                      <span className={`mini-badge ${cs(step.status).c}`}>{cs(step.status).l}</span>
                    </h4>
                    <div className="detail-row"><span className="label">Data completamento</span><span className="value">{fmtDate(step.completed_date)}</span></div>
                    <div className="detail-row"><span className="label">Pagamento</span><span className="value">{step.payment_proof || "—"}</span></div>
                    {step.notes && <div className="detail-row"><span className="label">Note</span><span className="value">{step.notes}</span></div>}
                    {step.document && <DocRow name={step.document} date={step.completed_date ? fmtDate(step.completed_date).slice(0, 5) : ""} />}
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button className="upload-btn" onClick={() => setModal({ type: "step-form", step })}><Icons.Edit /> Modifica dettagli</button>
                      <button className="upload-btn" onClick={() => handleCycleStepStatus(step)} style={{ borderColor: T.green, color: T.green }}><Icons.Refresh /> Cicla stato</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Summary KPIs */}
          <div style={{ display: "flex", gap: 16 }}>
            <div className="kpi-card green" style={{ flex: 1 }}>
              <div className="kpi-label">Fasi Completate</div>
              <div className="kpi-value" style={{ fontSize: 22 }}>{steps.filter(s => s.status === "done").length}</div>
              <div className="kpi-sub">su {steps.length} totali</div>
            </div>
            <div className="kpi-card amber" style={{ flex: 1 }}>
              <div className="kpi-label">In Corso</div>
              <div className="kpi-value" style={{ fontSize: 22 }}>{steps.filter(s => s.status === "in_progress").length}</div>
            </div>
            <div className="kpi-card blue" style={{ flex: 1 }}>
              <div className="kpi-label">Operatore</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{OPERATOR_LABELS[practice.operator] || practice.operator}</div>
              <div className="kpi-sub">{practice.power_mw} MW richiesti</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TabAviation() {
  const auths = [
    { name:"ENAC", st:"active", phases:[{n:"Analisi pre-fattibilità",s:"done",d:"10/01/2026"},{n:"Preparazione elaborati",s:"done",d:"25/01/2026"},{n:"Invio portale",s:"done",d:"02/02/2026"},{n:"Richiesta nulla osta",s:"active",d:"02/02/2026"},{n:"Nulla osta ricevuto",s:"pending",d:"—"}] },
    { name:"ENAV", st:"active", phases:[{n:"Analisi pre-fattibilità",s:"done",d:"12/01/2026"},{n:"Preparazione elaborati",s:"done",d:"28/01/2026"},{n:"Invio portale",s:"active",d:"05/02/2026"},{n:"Richiesta nulla osta",s:"pending",d:"—"},{n:"Nulla osta ricevuto",s:"pending",d:"—"}] },
    { name:"Aeronautica Militare", st:"pending", phases:[{n:"Analisi pre-fattibilità",s:"done",d:"15/01/2026"},{n:"Preparazione elaborati",s:"pending",d:"—"},{n:"Invio portale",s:"pending",d:"—"},{n:"Richiesta nulla osta",s:"pending",d:"—"},{n:"Nulla osta ricevuto",s:"pending",d:"—"}] },
  ];
  const [exp, setExp] = useState({0:true,1:false,2:false});
  return (
    <div className="fade-in">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div className="section-title" style={{margin:0}}><Icons.Plane/> Nulla Osta Aeronautici</div>
        <span className="mini-badge active" style={{fontSize:11,padding:"4px 12px"}}>Post-Accettazione</span>
      </div>
      <PhaseTracker phases={["Pre-fattibilità","Elaborati","Invio portali","Richiesta NO","NO ricevuti"]} activeIndex={3}/>
      <div style={{height:24}}/>
      {auths.map((a,ai) => (
        <div className="authority-section" key={ai}>
          <div className="authority-header" onClick={() => setExp(p => ({...p,[ai]:!p[ai]}))}>
            <div className="auth-name"><span style={{width:8,height:8,borderRadius:"50%",background:a.st==="done"?T.green:a.st==="active"?T.accent:T.textDim,display:"inline-block"}}/>{a.name}<span style={{fontWeight:400,color:T.textMuted,fontSize:11,marginLeft:4}}>({a.phases.filter(p=>p.s==="done").length}/{a.phases.length})</span></div>
            <span className={`mini-badge ${a.st==="active"?"active":"pending"}`}>{a.st==="active"?"In corso":"Da avviare"}</span>
          </div>
          {exp[ai] && <div className="authority-body" style={{animation:"fadeIn 0.2s ease"}}>{a.phases.map((p,pi) => <div className="auth-phase-row" key={pi}><span style={{display:"flex",alignItems:"center",gap:8,flex:1}}><span style={{width:6,height:6,borderRadius:"50%",background:p.s==="done"?T.green:p.s==="active"?T.accent:T.textDim}}/><span className="auth-phase-name" style={{color:p.s==="pending"?T.textDim:T.text}}>{p.n}</span></span><span className="auth-date">{p.d}</span><span className={`mini-badge ${p.s}`} style={{minWidth:70,textAlign:"center"}}>{p.s==="done"?"Completato":p.s==="active"?"In corso":"Da fare"}</span></div>)}</div>}
        </div>
      ))}
    </div>
  );
}

function TabAuthorization() {
  return (
    <div className="fade-in">
      <div className="section-title">Iter Autorizzativo</div>
      <PhaseTracker phases={["Avvio proc.","Art. 4A","Art. 4A bis","Conf. servizi","Tavolo tecnico","Decreto AU"]} activeIndex={2}/>
      <div style={{height:24}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <div className="section-title" style={{fontSize:13}}><Icons.Clock/> Timeline</div>
          <div className="timeline">
            {[{d:"15/03/2025",t:"Avvio procedimento",de:"Istanza presentata",s:"done"},{d:"10/05/2025",t:"Art. 4A",de:"Pubblicazione BURC",s:"done"},{d:"20/09/2025",t:"Art. 4A bis",de:"Periodo osservazioni",s:"done"},{d:"15/11/2025",t:"Conferenza dei Servizi",de:"Richieste integrazione",s:"active"},{d:"TBD",t:"Tavolo Tecnico",de:"",s:""},{d:"TBD",t:"Decreto AU",de:"",s:""}].map((e,i) => <div key={i} className={`timeline-item ${e.s}`}><div className="tl-date">{e.d}</div><div className="tl-title">{e.t}</div>{e.de && <div className="tl-desc">{e.de}</div>}</div>)}
          </div>
        </div>
        <div>
          <div className="section-title" style={{fontSize:13}}><Icons.Alert/> Scadenze Critiche</div>
          <div className="detail-card" style={{marginBottom:12}}><h4>Integrazioni CdS <span className="mini-badge overdue">Scadenza vicina</span></h4><div className="detail-row"><span className="label">Scadenza</span><span className="value" style={{color:T.red}}>15/04/2026</span></div><div className="detail-row"><span className="label">Ente</span><span className="value">Regione Marche</span></div></div>
          <div className="detail-card"><h4>Parere VIA <span className="mini-badge active">In attesa</span></h4><div className="detail-row"><span className="label">Ente</span><span className="value">MASE</span></div><div className="detail-row"><span className="label">Protocollo</span><span className="value" style={{fontFamily:"'JetBrains Mono'"}}>VIA-2025-08234</span></div></div>
        </div>
      </div>
    </div>
  );
}

function TabDesign() {
  const d = [{n:"SIA",p:"Ing. Verdi",dl:"2026-03-01",s:"done",c:"€45.000",pd:"€45.000"},{n:"Progetto Definitivo",p:"Studio Neri",dl:"2026-04-15",s:"active",c:"€72.000",pd:"€36.000"},{n:"Rel. Geologica",p:"Geol. Bianchi",dl:"2026-05-01",s:"active",c:"€12.000",pd:"€6.000"},{n:"Rel. Acustica",p:"Ing. Acustica",dl:"2026-05-15",s:"pending",c:"€8.500",pd:"€0"},{n:"Piano Dismissione",p:"Ing. Verdi",dl:"2026-06-01",s:"pending",c:"€15.000",pd:"€0"}];
  return <div className="fade-in"><div className="section-title"><Icons.Gear/> Elaborati Tecnici</div><div className="table-container"><table><thead><tr><th>Elaborato</th><th>Professionista</th><th>Scadenza</th><th>Stato</th><th>Costo</th><th>Pagato</th></tr></thead><tbody>{d.map((x,i)=><tr key={i}><td style={{fontWeight:500}}>{x.n}</td><td style={{color:T.textMuted}}>{x.p}</td><td style={{fontFamily:"'JetBrains Mono'",fontSize:11}}>{x.dl}</td><td><span className={`mini-badge ${x.s}`}>{x.s==="done"?"Consegnato":x.s==="active"?"In corso":"Da avviare"}</span></td><td style={{fontFamily:"'JetBrains Mono'",fontSize:12}}>{x.c}</td><td style={{fontFamily:"'JetBrains Mono'",fontSize:12,color:x.pd===x.c?T.green:T.amber}}>{x.pd}</td></tr>)}</tbody></table></div></div>;
}

function TabSPV() {
  const ph = [{n:"Richiesta notaio",s:"done",d:"10/11/2025"},{n:"Costituzione società",s:"done",d:"25/11/2025"},{n:"Apertura P.IVA",s:"done",d:"28/11/2025"},{n:"Conto corrente",s:"done",d:"05/12/2025"},{n:"PEC",s:"done",d:"06/12/2025"},{n:"Comm. commercialista",s:"done",d:"10/12/2025"},{n:"Libro soci",s:"done",d:"15/12/2025"},{n:"Visura",s:"active",d:"In corso"},{n:"Voltura Terna",s:"pending",d:"—"}];
  return <div className="fade-in"><div className="detail-grid" style={{marginBottom:24}}><div className="detail-card"><h4>Dati SPV</h4><div className="detail-row"><span className="label">Rag. sociale</span><span className="value">Ascoli Wind S.r.l.</span></div><div className="detail-row"><span className="label">P.IVA</span><span className="value" style={{fontFamily:"'JetBrains Mono'"}}>IT029837XXXX</span></div><div className="detail-row"><span className="label">PEC</span><span className="value" style={{fontSize:11}}>ascoliwind@pec.it</span></div></div><div className="detail-card"><h4>Documenti Legali</h4><DocRow name="Atto_Costitutivo.pdf" date="25/11"/><DocRow name="Statuto.pdf" date="25/11"/><DocRow name="Visura_Camerale.pdf" date="15/01"/></div></div><div className="section-title">Fasi SPV</div><div className="table-container"><table><thead><tr><th>Fase</th><th>Stato</th><th>Data</th></tr></thead><tbody>{ph.map((p,i)=><tr key={i}><td style={{fontWeight:500}}>{p.n}</td><td><span className={`mini-badge ${p.s}`}>{p.s==="done"?"Completato":p.s==="active"?"In corso":"Da fare"}</span></td><td style={{fontFamily:"'JetBrains Mono'",fontSize:11}}>{p.d}</td></tr>)}</tbody></table></div></div>;
}

function TabAccounting() {
  return <div className="fade-in"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}><div><div className="section-title"><Icons.Upload/> Inviati al Commercialista</div><div className="detail-card"><h4>Fatture</h4><DocRow name="FT_2025_001.pdf" date="15/01"/><DocRow name="FT_2025_002.pdf" date="20/01"/><DocRow name="FT_2026_001.pdf" date="05/02"/></div><div className="detail-card" style={{marginTop:12}}><h4>Estratti Conto</h4><DocRow name="EC_Gen2026.pdf" date="01/02"/><DocRow name="EC_Feb2026.pdf" date="01/03"/></div></div><div><div className="section-title"><Icons.File/> Ricevuti</div><div className="detail-card"><h4>Bilanci</h4><DocRow name="Bilancio_2025_Draft.pdf" date="10/03"/></div><div className="detail-card" style={{marginTop:12}}><h4>F24</h4><DocRow name="F24_IVA_Gen2026.pdf" date="16/02"/><DocRow name="F24_IRES_Acconto.pdf" date="30/11"/></div></div></div><div className="section-title" style={{marginTop:24}}><Icons.Euro/> Scadenze Fiscali</div><div className="table-container"><table><thead><tr><th>Scadenza</th><th>Tipo</th><th>Importo</th><th>Stato</th></tr></thead><tbody><tr><td style={{fontFamily:"'JetBrains Mono'",fontSize:11}}>16/03/2026</td><td>F24 IVA Feb</td><td style={{fontFamily:"'JetBrains Mono'"}}>€3.200</td><td><span className="mini-badge done">Pagato</span></td></tr><tr><td style={{fontFamily:"'JetBrains Mono'",fontSize:11}}>16/04/2026</td><td>F24 IVA Mar</td><td style={{fontFamily:"'JetBrains Mono'"}}>€2.800</td><td><span className="mini-badge active">In scadenza</span></td></tr><tr><td style={{fontFamily:"'JetBrains Mono'",fontSize:11}}>30/06/2026</td><td>IRES Saldo</td><td style={{fontFamily:"'JetBrains Mono'"}}>€12.500</td><td><span className="mini-badge pending">Da pagare</span></td></tr></tbody></table></div></div>;
}

// ═══════════════════════════════════════════════════════════════════════
// PROJECT DETAIL
// ═══════════════════════════════════════════════════════════════════════
function ProjectDetail({ project, onBack, onEdit, onDelete, onAddTask, projects, db, toast }) {
  const [tab, setTab] = useState("land");
  const tabs = [{id:"land",l:"Terreni"},{id:"connection",l:"Connessione"},{id:"aviation",l:"Aviation"},{id:"authorization",l:"Autorizzazione"},{id:"design",l:"Progettazione"},{id:"spv",l:"SPV"},{id:"accounting",l:"Contabilità"}];
  const content = { land:<TabLand db={db} projectId={project.id} toast={toast} />, connection:<TabConnection db={db} projectId={project.id} toast={toast} />, aviation:<TabAviation/>, authorization:<TabAuthorization/>, design:<TabDesign/>, spv:<TabSPV/>, accounting:<TabAccounting/> };
  const I = typeIcons[project.type];
  return (
    <>
      <div className="project-hero">
        <div className="project-hero-top">
          <div className="project-icon" style={{background:`${typeColors[project.type]}15`,color:typeColors[project.type]}}><I/></div>
          <div>
            <h2>{project.name}</h2>
            <div className="project-meta">
              <span className="meta-item"><TypeBadge type={project.type}/></span>
              <span className="meta-item"><Icons.Zap/> {project.mw} MW</span>
              <span className="meta-item"><Icons.MapPin/> {project.region}</span>
              <span className="meta-item"><StatusBadge status={project.status} size="small"/></span>
            </div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button className="btn btn-ghost" onClick={onBack}><Icons.ChevLeft/> Dashboard</button>
            <button className="btn btn-ghost" onClick={onEdit}><Icons.Edit/> Modifica</button>
            <button className="btn btn-danger btn-sm" onClick={onDelete}><Icons.Trash/> Elimina</button>
            <button className="btn btn-primary" onClick={() => onAddTask(project.id)}><Icons.Plus/> Task</button>
          </div>
        </div>
      </div>
      <div className="tabs-bar">{tabs.map(t => <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>{t.l}</button>)}</div>
      <div className="tab-content">{content[tab]}</div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════
function App() {
  const [db, setDb] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const mainRef = useRef(null);
  const { toast, ToastContainer } = useToast();

  // ── Data fetching ──
  const fetchAll = useCallback(async (client) => {
    setLoading(true);
    try {
      const [p, t, pay] = await Promise.all([
        client.from("projects").select("*").order("created_at", { ascending: false }).execute(),
        client.from("tasks").select("*").order("deadline").execute(),
        client.from("payments").select("*").order("created_at", { ascending: false }).execute(),
      ]);
      setProjects(p || []);
      setTasks(t || []);
      setPayments(pay || []);
    } catch (e) {
      toast("Errore caricamento dati: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleConnect = useCallback((client) => {
    setDb(client);
    fetchAll(client);
  }, [fetchAll]);

  // ── Enriched project data ──
  const enrichedProjects = projects.map(p => ({
    ...p,
    tasks_count: tasks.filter(t => t.project_id === p.id).length,
    delayed_count: tasks.filter(t => t.project_id === p.id && t.status === "overdue").length,
  }));

  const filtered = typeFilter === "all" ? enrichedProjects : enrichedProjects.filter(p => p.type === typeFilter);
  const totalMW = projects.reduce((s, p) => s + Number(p.mw || 0), 0);
  const totalDelayed = tasks.filter(t => t.status === "overdue").length;
  const phases = {};
  projects.forEach(p => { phases[p.status] = (phases[p.status] || 0) + 1; });

  // ── CRUD: Projects ──
  const handleSaveProject = async (form) => {
    setSaving(true);
    try {
      const data = { ...form, mw: Number(form.mw) || 0, completion: Number(form.completion) || 0 };
      if (modal.project) {
        await db.from("projects").eq("id", modal.project.id).update(data);
        toast("Progetto aggiornato");
      } else {
        await db.from("projects").insert(data);
        toast("Progetto creato");
      }
      setModal(null);
      await fetchAll(db);
      if (modal.project && selectedProject?.id === modal.project.id) {
        const updated = (await db.from("projects").eq("id", modal.project.id).execute())[0];
        if (updated) setSelectedProject(updated);
      }
    } catch (e) {
      toast("Errore: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    setSaving(true);
    try {
      await db.from("projects").eq("id", modal.projectId).delete();
      toast("Progetto eliminato");
      setModal(null);
      setView("dashboard");
      setSelectedProject(null);
      await fetchAll(db);
    } catch (e) {
      toast("Errore: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── CRUD: Tasks ──
  const handleSaveTask = async (form) => {
    setSaving(true);
    try {
      await db.from("tasks").insert(form);
      toast("Task creato");
      setModal(null);
      await fetchAll(db);
    } catch (e) {
      toast("Errore: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const next = task.status === "done" ? "pending" : "done";
      await db.from("tasks").eq("id", task.id).update({ status: next });
      await fetchAll(db);
    } catch (e) {
      toast("Errore: " + e.message, "error");
    }
  };

  // ── Navigation ──
  const go = (v, proj = null) => {
    setView(v);
    setSelectedProject(proj);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const breadcrumbs = () => {
    if (view === "dashboard") return [{ label: "Dashboard", current: true }];
    if (view === "tasks") return [{ label: "Dashboard", onClick: () => go("dashboard") }, { label: "Task Manager", current: true }];
    if (view === "payments") return [{ label: "Dashboard", onClick: () => go("dashboard") }, { label: "Pagamenti", current: true }];
    if (view === "project" && selectedProject) return [{ label: "Dashboard", onClick: () => go("dashboard") }, { label: selectedProject.name, current: true }];
    return [];
  };

  // ── Setup screen ──
  if (!db) return <SetupScreen onConnect={handleConnect} />;

  // ── Project name lookup ──
  const projName = (pid) => projects.find(p => p.id === pid)?.name || "—";

  return (
    <>
      {ToastContainer}

      {/* Modals */}
      {modal?.type === "project-form" && (
        <ProjectFormModal project={modal.project} onSave={handleSaveProject} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === "task-form" && (
        <TaskFormModal projects={projects} projectId={modal.projectId} onSave={handleSaveTask} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === "confirm-delete" && (
        <ConfirmModal title="Elimina Progetto" message={`Sei sicuro di voler eliminare "${modal.projectName}"? Tutti i task e pagamenti collegati saranno eliminati (CASCADE).`} onConfirm={handleDeleteProject} onClose={() => setModal(null)} confirming={saving} />
      )}

      <div className="app">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h1><span className="logo-icon"><Icons.Zap/></span> Gruppo Visconti</h1>
            <span>Project Management System</span>
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-section">Principale</div>
            {[
              { id: "dashboard", label: "Dashboard", icon: Icons.Home },
              { id: "tasks", label: "Task Manager", icon: Icons.Tasks, badge: totalDelayed },
              { id: "payments", label: "Pagamenti", icon: Icons.Euro },
            ].map(item => (
              <div key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => go(item.id)}>
                <item.icon /> {item.label}
                {item.badge > 0 && <span className="badge">{item.badge}</span>}
              </div>
            ))}
            <div className="sidebar-section" style={{ marginTop: 16 }}>Progetti Recenti</div>
            {enrichedProjects.slice(0, 6).map(p => {
              const Ic = typeIcons[p.type];
              return (
                <div key={p.id} className={`nav-item ${view === "project" && selectedProject?.id === p.id ? "active" : ""}`} onClick={() => go("project", p)}>
                  <span style={{ color: typeColors[p.type] }}><Ic /></span>
                  <span style={{ fontSize: 12 }}>{p.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: T.textDim, fontFamily: "'JetBrains Mono'" }}>{p.mw}MW</span>
                </div>
              );
            })}
          </nav>
          <div className="sidebar-user">
            <div className="avatar">LV</div>
            <div className="user-info"><div className="name">Luciano V.</div><div className="role">Admin</div></div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main" ref={mainRef}>
          <div className="topbar">
            <div className="topbar-left">
              <div className="breadcrumb">
                {breadcrumbs().map((b, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i > 0 && <span className="bc-sep"><Icons.ChevRight /></span>}
                    {b.current ? <span className="bc-current">{b.label}</span> : <span className="bc-item" onClick={b.onClick}>{b.label}</span>}
                  </span>
                ))}
              </div>
            </div>
            <div className="topbar-right">
              <div className="search-box"><Icons.Search /><input placeholder="Cerca progetti, task..." /></div>
              <div className="icon-btn" onClick={() => fetchAll(db)} title="Ricarica dati"><Icons.Refresh /></div>
              <div className="icon-btn"><Icons.Bell />{totalDelayed > 0 && <span className="notif-dot" />}</div>
            </div>
          </div>

          {/* ════ DASHBOARD ════ */}
          {view === "dashboard" && (
            <div className="content" style={{ position: "relative" }}>
              {loading && <div className="loading-overlay"><span className="spinner" /></div>}
              <div className="page-header fade-in">
                <div><h2>Dashboard</h2><div className="subtitle">Pipeline progetti – Gruppo Visconti · Supabase Live</div></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => fetchAll(db)}><Icons.Refresh /> Aggiorna</button>
                  <button className="btn btn-primary" onClick={() => setModal({ type: "project-form" })}><Icons.Plus /> Nuovo Progetto</button>
                </div>
              </div>
              <div className="kpi-grid">
                <div className="kpi-card blue fade-in"><div className="kpi-label"><Icons.Zap /> MW Totali Pipeline</div><div className="kpi-value">{totalMW.toLocaleString()}</div><div className="kpi-sub">{projects.length} progetti attivi</div></div>
                <div className="kpi-card green fade-in fade-in-delay-1"><div className="kpi-label"><Icons.Folder /> Progetti per Tipo</div><div style={{display:"flex",gap:16,marginTop:8}}>{Object.entries(typeLabels).map(([k,v])=><div key={k} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,fontFamily:"'JetBrains Mono'",color:typeColors[k]}}>{projects.filter(p=>p.type===k).length}</div><div style={{fontSize:10,color:T.textDim}}>{v}</div></div>)}</div></div>
                <div className="kpi-card amber fade-in fade-in-delay-2"><div className="kpi-label"><Icons.Clock /> Fasi Frequenti</div><div style={{marginTop:4}}>{Object.entries(phases).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:T.textMuted}}>{k}</span><span style={{fontFamily:"'JetBrains Mono'",fontWeight:600}}>{v}</span></div>)}</div></div>
                <div className="kpi-card red fade-in fade-in-delay-3"><div className="kpi-label"><Icons.Alert /> Task in Ritardo</div><div className="kpi-value">{totalDelayed}</div><div className="kpi-sub">su {tasks.length} task totali</div></div>
              </div>
              <div className="table-container fade-in fade-in-delay-4">
                <div className="table-header">
                  <h3>Tutti i Progetti</h3>
                  <div className="table-filters">{["all","wind","agro-pv","storage"].map(f=><button key={f} className={`filter-chip ${typeFilter===f?"active":""}`} onClick={()=>setTypeFilter(f)}>{f==="all"?"Tutti":typeLabels[f]}</button>)}</div>
                </div>
                <table>
                  <thead><tr><th>Progetto</th><th>Tipo</th><th>MW</th><th>Regione</th><th>Stato</th><th>Avanzamento</th><th>Task</th><th></th></tr></thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} onClick={() => go("project", p)}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><TypeBadge type={p.type} /></td>
                        <td><span className="mw-val">{p.mw}</span></td>
                        <td style={{ color: T.textMuted }}>{p.region}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td><div className="progress-bar"><div className="progress-fill" style={{ width:`${p.completion}%`, background:progressColor(p.completion) }}/></div><span style={{fontSize:11,fontFamily:"'JetBrains Mono'",color:T.textMuted}}>{p.completion}%</span></td>
                        <td><span style={{fontSize:12,color:T.textMuted}}>{p.tasks_count}</span>{p.delayed_count > 0 && <span style={{marginLeft:6,fontSize:10,color:T.red,fontWeight:600}}>({p.delayed_count})</span>}</td>
                        <td>
                          <div className="row-actions">
                            <button className="row-action-btn" onClick={e => { e.stopPropagation(); setModal({ type: "project-form", project: p }); }} title="Modifica"><Icons.Edit /></button>
                            <button className="row-action-btn danger" onClick={e => { e.stopPropagation(); setModal({ type: "confirm-delete", projectId: p.id, projectName: p.name }); }} title="Elimina"><Icons.Trash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>Nessun progetto trovato. Crea il tuo primo progetto!</div>}
              </div>
            </div>
          )}

          {/* ════ PROJECT DETAIL ════ */}
          {view === "project" && selectedProject && (
            <ProjectDetail
              project={selectedProject}
              projects={projects}
              db={db}
              toast={toast}
              onBack={() => go("dashboard")}
              onEdit={() => setModal({ type: "project-form", project: selectedProject })}
              onDelete={() => setModal({ type: "confirm-delete", projectId: selectedProject.id, projectName: selectedProject.name })}
              onAddTask={(pid) => setModal({ type: "task-form", projectId: pid })}
            />
          )}

          {/* ════ TASKS ════ */}
          {view === "tasks" && (
            <div className="content" style={{ position: "relative" }}>
              {loading && <div className="loading-overlay"><span className="spinner" /></div>}
              <div className="page-header fade-in">
                <div><h2>Task Manager</h2><div className="subtitle">Attività dal database Supabase</div></div>
                <button className="btn btn-primary" onClick={() => setModal({ type: "task-form" })}><Icons.Plus /> Nuovo Task</button>
              </div>
              <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                <div className="kpi-card red fade-in"><div className="kpi-label"><Icons.Alert /> In Ritardo</div><div className="kpi-value">{tasks.filter(t => t.status === "overdue").length}</div></div>
                <div className="kpi-card amber fade-in fade-in-delay-1"><div className="kpi-label"><Icons.Clock /> In Corso</div><div className="kpi-value">{tasks.filter(t => t.status === "in_progress").length}</div></div>
                <div className="kpi-card green fade-in fade-in-delay-2"><div className="kpi-label"><Icons.Check /> Completati</div><div className="kpi-value">{tasks.filter(t => t.status === "done").length}</div></div>
              </div>
              <div className="table-container fade-in fade-in-delay-3">
                <div className="table-header"><h3>Tutte le Attività</h3></div>
                {[...tasks].sort((a, b) => {
                  const o = { overdue: 0, in_progress: 1, pending: 2, done: 3 };
                  return (o[a.status] ?? 2) - (o[b.status] ?? 2);
                }).map(t => (
                  <div className="task-row" key={t.id}>
                    <div className={`task-checkbox ${t.status === "done" ? "done" : ""}`} onClick={() => handleToggleTask(t)}>{t.status === "done" && <Icons.Check />}</div>
                    <span className={`task-title ${t.status === "done" ? "done-text" : ""}`}>{t.title}</span>
                    <span className="task-entity">{t.entity}</span>
                    <span className="task-assignee">{t.assignee}</span>
                    <span className="task-deadline" style={{ color: t.status === "overdue" ? T.red : T.textDim }}>{t.deadline || "—"}</span>
                    <span style={{ fontSize: 10, color: T.textDim }}>{projName(t.project_id)}</span>
                    <span className={`mini-badge ${t.status === "overdue" ? "overdue" : t.status === "done" ? "done" : t.status === "in_progress" ? "active" : "pending"}`}>
                      {t.status === "overdue" ? "In ritardo" : t.status === "done" ? "Completato" : t.status === "in_progress" ? "In corso" : "Da fare"}
                    </span>
                  </div>
                ))}
                {tasks.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>Nessun task. Crea il primo!</div>}
              </div>
            </div>
          )}

          {/* ════ PAYMENTS ════ */}
          {view === "payments" && (
            <div className="content" style={{ position: "relative" }}>
              {loading && <div className="loading-overlay"><span className="spinner" /></div>}
              <div className="page-header fade-in"><div><h2>Pagamenti</h2><div className="subtitle">Registro centralizzato – Supabase</div></div></div>
              <div className="table-container fade-in fade-in-delay-1">
                <div className="payment-row header"><span>Descrizione</span><span>Modulo</span><span>Importo</span><span>Metodo</span><span>Data</span><span>Stato</span></div>
                {payments.map(p => (
                  <div className="payment-row" key={p.id}>
                    <span style={{ fontWeight: 500 }}>{p.description}</span>
                    <span className="task-entity">{p.module}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 500 }}>€{Number(p.amount).toLocaleString()}</span>
                    <span style={{ color: T.textMuted }}>{p.method}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: T.textDim }}>{p.payment_date || "—"}</span>
                    <span className={`mini-badge ${p.status === "paid" ? "done" : "pending"}`}>{p.status === "paid" ? "Pagato" : "Da pagare"}</span>
                  </div>
                ))}
                {payments.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>Nessun pagamento registrato.</div>}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY — guarantees the page NEVER 404s due to runtime crash
// ═══════════════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("GV ProjectManager crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100vh", background: "#0c0f14",
          color: "#e8ecf4", fontFamily: "'DM Sans', sans-serif",
          textAlign: "center", padding: 32,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: "rgba(239,68,68,0.12)", color: "#ef4444",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, fontSize: 28,
          }}>⚠</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Errore applicazione
          </h2>
          <p style={{ color: "#7a839a", fontSize: 13, maxWidth: 420, lineHeight: 1.6, marginBottom: 12 }}>
            Si è verificato un errore imprevisto. Verifica la connessione e le credenziali Supabase.
          </p>
          <pre style={{
            background: "#141820", border: "1px solid #242a38", borderRadius: 8,
            padding: "12px 16px", fontSize: 11, color: "#ef4444",
            maxWidth: 480, overflow: "auto", marginBottom: 20,
            fontFamily: "'JetBrains Mono', monospace", textAlign: "left",
          }}>
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); }}
            style={{
              background: "#3b82f6", color: "white", border: "none",
              borderRadius: 8, padding: "10px 24px", fontSize: 13,
              fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Riprova
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SAFE EXPORT — wraps App in ErrorBoundary so page ALWAYS renders
// ═══════════════════════════════════════════════════════════════════════
export default function SafeApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
