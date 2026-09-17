"use client";

import { useEffect, useState } from "react";
import ViscontiProjectSpvWorkflow from "./ViscontiProjectSpvWorkflow";

export default function ViscontiProjectSocietaryWorkflow({ projectId }) {
  const [project, setProject] = useState(null);
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/visconti-project-detail?projectId=${encodeURIComponent(projectId)}&resource=project`, { cache: "no-store" })
      .then((r) => r.json()).then((data) => setProject(data?.[0] || null)).catch(() => setProject(null));
  }, [projectId]);
  if (!project) return null;
  if (project.requires_spv === false) return <section style={{maxWidth:1380,margin:"18px auto 0",padding:"0 34px",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif"}}><div style={{border:"1px solid #dcefe5",background:"#f7fcf9",borderRadius:14,padding:"15px 18px"}}><div style={{fontSize:10,fontWeight:800,color:"#18774e",textTransform:"uppercase",letterSpacing:".08em"}}>Percorso societario diretto</div><div style={{fontSize:13,fontWeight:800,color:"#172033",marginTop:4}}>Gruppo Visconti S.r.l. è il titolare/presentatore del progetto.</div><div style={{fontSize:10,color:"#687181",marginTop:5}}>Non sono richieste costituzione SPV, nuova P.IVA/PEC o voltura della connessione. La progettazione tecnica resta affidata a Gruppo Visconti Servizi.</div></div></section>;
  return <ViscontiProjectSpvWorkflow projectId={projectId} />;
}
