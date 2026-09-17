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
    const byName = new Map(projects.map((p) => [String(p.project_name || p.name || "").trim().toLowerCase(), p]));

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
      const requested = project.connection_power_mw;
      const projectMw = project.power_mw;
      const mwCell = row.children[2];
      if (!mwCell || requested == null) return;
      const container = document.createElement("div");
      container.className = "gv-mw-compare";
      container.innerHTML = `<b>${projectMw ?? "—"} MW progetto</b><span>Richiesta connessione: ${requested} MW</span>`;
      mwCell.replaceChildren(container);
    });

    const style = document.createElement("style");
    style.textContent = `:root{--gv-type-pv:#d7ad1b;--gv-type-wind:#4285c5;--gv-type-bess:#8a63c7;--gv-type-agri:#4b9a58;--gv-type-hybrid:#d47c2b}.gv-type-chip{display:inline-flex;align-items:center;gap:4px;margin-top:5px;margin-right:5px;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:850;white-space:nowrap}.gv-type-pv{background:#fff5cf;color:#8b6800}.gv-type-wind{background:#e7f2ff;color:#2165a8}.gv-type-bess{background:#f0e9ff;color:#6842a8}.gv-type-agri{background:#e7f6e9;color:#28753a}.gv-type-hybrid{background:#fff0df;color:#a85a16}.gv-mw-compare{display:flex;flex-direction:column;gap:3px;line-height:1.25;white-space:nowrap}.gv-mw-compare b{font-size:11px}.gv-mw-compare span{font-size:9px;color:#737c8c}`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [projects]);
  return null;
}
