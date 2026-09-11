"use client";

import { useEffect } from "react";

const TYPES = {
  fotovoltaico: { label: "Fotovoltaico", tone: "pv", mark: "☀" },
  eolico: { label: "Eolico", tone: "wind", mark: "↝" },
  bess: { label: "BESS", tone: "bess", mark: "▣" },
  agrivoltaico: { label: "Agrivoltaico", tone: "agri", mark: "◈" },
  ibrido: { label: "Ibrido", tone: "hybrid", mark: "⚡" },
};

export default function ViscontiProjectTypeDecorator({ projects = [] }) {
  useEffect(() => {
    let cancelled = false;
    const root = document.querySelector(".pl-shell");
    if (!root) return;
    const byName = new Map(projects.map((p) => [String(p.project_name || p.name || "").trim().toLowerCase(), p]));
    const connectionMw = new Map();

    async function loadConnectionMw() {
      const results = await Promise.all(projects.map(async (p) => {
        const id = p.project_id || p.id;
        if (!id) return null;
        try {
          const r = await fetch(`/api/visconti-project-detail?projectId=${encodeURIComponent(id)}&resource=connections`, { cache: "no-store" });
          if (!r.ok) return null;
          const data = await r.json();
          const practice = Array.isArray(data) ? data[0] : null;
          return practice?.power_mw != null ? [String(id), Number(practice.power_mw)] : null;
        } catch (_) { return null; }
      }));
      if (cancelled) return;
      results.filter(Boolean).forEach(([id, mw]) => connectionMw.set(id, mw));
      apply();
    }

    const apply = () => {
      root.querySelectorAll("a.pl-row:not(.pl-row-head)").forEach((row) => {
        const name = row.querySelector(".pl-name")?.textContent?.trim().toLowerCase();
        const project = byName.get(name);
        if (!project) return;
        const cfg = TYPES[project.project_type];
        if (cfg) {
          row.classList.add(`pl-type-row-${cfg.tone}`);
          row.style.borderLeft = `4px solid var(--gv-type-${cfg.tone})`;
          const first = row.querySelector(".pl-name")?.parentElement;
          if (first && !first.querySelector(".gv-type-chip")) {
            const chip = document.createElement("span");
            chip.className = `gv-type-chip gv-type-${cfg.tone}`;
            chip.textContent = `${cfg.mark} ${cfg.label}`;
            first.insertBefore(chip, first.querySelector(".pl-muted"));
          }
        }
        const id = String(project.project_id || project.id || "");
        const requested = connectionMw.get(id);
        const projectMw = Number(project.power_mw || 0);
        const mwCell = row.children[2];
        if (!mwCell || requested == null) return;
        if (mwCell.querySelector(".gv-mw-compare")) return;
        const delta = projectMw - requested;
        const deltaLabel = Math.abs(delta) < 0.001 ? "0 MW" : `${delta > 0 ? "+" : ""}${delta.toFixed(2).replace(/\.00$/, "")} MW`;
        mwCell.innerHTML = `<div class="gv-mw-compare"><b>${projectMw} MW progetto</b><span>Richiesta connessione: ${requested} MW</span><strong>Δ progetto − richiesta: ${deltaLabel}</strong></div>`;
      });
    };

    const style = document.createElement("style");
    style.textContent = `:root{--gv-type-pv:#d7ad1b;--gv-type-wind:#4285c5;--gv-type-bess:#8a63c7;--gv-type-agri:#4b9a58;--gv-type-hybrid:#d47c2b}.gv-type-chip{display:inline-flex;align-items:center;gap:4px;margin-top:5px;margin-right:5px;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:850;white-space:nowrap}.gv-type-pv{background:#fff5cf;color:#8b6800}.gv-type-wind{background:#e7f2ff;color:#2165a8}.gv-type-bess{background:#f0e9ff;color:#6842a8}.gv-type-agri{background:#e7f6e9;color:#28753a}.gv-type-hybrid{background:#fff0df;color:#a85a16}.gv-mw-compare{display:flex;flex-direction:column;gap:3px;line-height:1.25;white-space:nowrap}.gv-mw-compare b{font-size:11px}.gv-mw-compare span{font-size:9px;color:#737c8c}.gv-mw-compare strong{font-size:9px;color:#b43a34}`;
    document.head.appendChild(style);
    apply();
    loadConnectionMw();
    const observer = new MutationObserver(apply);
    observer.observe(root, { childList: true, subtree: true });
    return () => { cancelled = true; observer.disconnect(); style.remove(); };
  }, [projects]);
  return null;
}
