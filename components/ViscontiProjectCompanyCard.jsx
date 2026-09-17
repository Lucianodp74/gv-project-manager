"use client";

import { useEffect, useState } from "react";

export default function ViscontiProjectCompanyCard({ projectId }) {
  const [project, setProject] = useState(null);
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/visconti-project-detail?projectId=${encodeURIComponent(projectId)}&resource=project`, { cache: "no-store" })
      .then((r) => r.json()).then((data) => setProject(data?.[0] || null)).catch(() => setProject(null));
  }, [projectId]);
  if (!project) return null;
  const direct = project.requires_spv === false;
  return <section style={{maxWidth:1380,margin:"18px auto 0",padding:"0 34px"}}><div style={{background:"#fff",border:"1px solid #e7e9ee",borderRadius:14,padding:"15px 18px",display:"flex",gap:18,alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 10px rgba(20,28,45,.03)",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif"}}><div><div style={{fontSize:9,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase",color:"#8a92a1"}}>Gestione societaria</div><div style={{display:"flex",gap:8,alignItems:"center",marginTop:5,flexWrap:"wrap"}}><span style={{borderRadius:999,padding:"5px 9px",fontSize:9,fontWeight:800,background:direct?"#eaf8f1":"#edf3ff",color:direct?"#18774e":"#3d61ad"}}>{direct?"DIRETTO · GRUPPO VISCONTI S.R.L.":"SPV · COSTITUZIONE E VOLTURA"}</span><span style={{fontSize:11,color:"#172033"}}>Titolare: <b>{project.proposer_company || (direct ? "Gruppo Visconti S.r.l." : "Da definire con SPV")}</b></span></div></div><div style={{fontSize:10,color:"#687181",textAlign:"right"}}>Progettazione: <b style={{color:"#172033"}}>{project.developer_company || "Gruppo Visconti Servizi"}</b><br/>{direct?"Nessuna SPV · nessuna voltura":"Percorso SPV attivo"}</div></div></section>;
}
