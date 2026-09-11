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
    const root = document.querySelector(".pl-shell");
    if (!root) return;
    const byName = new Map(projects.map((p) => [String(p.project_name || p.name || "").trim().toLowerCase(), p.project_type]));
    const apply = () => {
      root.querySelectorAll("a.pl-row:not(.pl-row-head)").forEach((row) => {
        const name = row.querySelector(".pl-name")?.textContent?.trim().toLowerCase();
        const type = byName.get(name);
        const cfg = TYPES[type];
        if (!cfg) return;
        row.classList.add(`pl-type-row-${cfg.tone}`);
        row.style.borderLeft = `4px solid var(--gv-type-${cfg.tone})`;
        const first = row.querySelector(".pl-name")?.parentElement;
        if (first && !first.querySelector(".gv-type-chip")) {
          const chip = document.createElement("span");
          chip.className = `gv-type-chip gv-type-${cfg.tone}`;
          chip.textContent = `${cfg.mark} ${cfg.label}`;
          first.insertBefore(chip, first.querySelector(".pl-muted"));
        }
      });
    };
    const style = document.createElement("style");
    style.textContent = `:root{--gv-type-pv:#d7ad1b;--gv-type-wind:#4285c5;--gv-type-bess:#8a63c7;--gv-type-agri:#4b9a58;--gv-type-hybrid:#d47c2b}.gv-type-chip{display:inline-flex;align-items:center;gap:4px;margin-top:5px;margin-right:5px;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:850;white-space:nowrap}.gv-type-pv{background:#fff5cf;color:#8b6800}.gv-type-wind{background:#e7f2ff;color:#2165a8}.gv-type-bess{background:#f0e9ff;color:#6842a8}.gv-type-agri{background:#e7f6e9;color:#28753a}.gv-type-hybrid{background:#fff0df;color:#a85a16}`;
    document.head.appendChild(style);
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); style.remove(); };
  }, [projects]);
  return null;
}
