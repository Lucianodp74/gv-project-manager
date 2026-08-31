"use client";

export default function ViscontiWorkHomeV1() {
  const attention = [
    ["EOL-024", "Integrazione archeologica", "Vincenzo", "Bloccato"],
    ["FV-018", "Dati per relazione acustica", "Luciano", "In attesa"],
  ];
  const tasks = [
    ["Controllo elaborati progetto", "EOL-024", "Oggi"],
    ["Verifica incarichi specialisti", "FV-018", "Domani"],
    ["Revisione progetto L'Aquila", "EOL-031", "04/09"],
  ];
  const projects = [
    ["EOL-024", "Parco eolico — Foggia", "Sviluppo", "72%"],
    ["FV-018", "Fotovoltaico — Sardegna", "Connessione", "48%"],
    ["EOL-031", "Eolico — Abruzzo", "Sviluppo", "61%"],
  ];
  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif",padding:28,maxWidth:1200,margin:"0 auto",color:"#18212f"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div><div style={{fontSize:11,letterSpacing:".12em",fontWeight:800,color:"#687386"}}>CABINA DI REGIA</div><h1 style={{margin:"4px 0",fontSize:30}}>Buongiorno, Luciano</h1><div style={{color:"#687386"}}>Cosa richiede attenzione oggi.</div></div>
        <div style={{width:40,height:40,borderRadius:20,display:"grid",placeItems:"center",background:"#e9efee",fontWeight:800,color:"#176b67"}}>LD</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[['2','Problemi','richiedono attenzione'],['4','In attesa','da sbloccare'],['7','Scadenze','nei prossimi 7 giorni'],['18','Progetti attivi','12 in linea']].map(([n,l,s])=><div key={l} style={{background:'#fff',border:'1px solid #e7eaf0',borderRadius:14,padding:16}}><small style={{color:'#687386'}}>{l.toUpperCase()}</small><div style={{fontSize:27,fontWeight:800,margin:'5px 0'}}>{n}</div><small style={{color:'#687386'}}>{s}</small></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16}}>
        <div style={{background:'#fff',border:'1px solid #e7eaf0',borderRadius:14,padding:18}}><h3 style={{marginTop:0}}>Le mie attività</h3>{tasks.map(([a,p,d])=><div key={a} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderTop:'1px solid #e7eaf0'}}><div><b>{a}</b><div style={{fontSize:11,color:'#687386'}}>{p}</div></div><span style={{fontSize:11,fontWeight:700}}>{d}</span></div>)}</div>
        <div style={{background:'#fff',border:'1px solid #e7eaf0',borderRadius:14,padding:18}}><h3 style={{marginTop:0}}>Problemi / blocchi</h3>{attention.map(([p,a,u,s])=><div key={a} style={{padding:'12px 0',borderTop:'1px solid #e7eaf0'}}><b>{a}</b><div style={{fontSize:11,color:'#687386'}}>{p} · {u}</div><span style={{fontSize:11,fontWeight:700,color:s==='Bloccato'?'#c7463f':'#c98427'}}>{s}</span></div>)}</div>
      </div>
      <div style={{marginTop:16,background:'#fff',border:'1px solid #e7eaf0',borderRadius:14,padding:18}}><h3 style={{marginTop:0}}>Progetti da tenere sotto controllo</h3><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>{projects.map(([c,n,s,p])=><div key={c} style={{border:'1px solid #e7eaf0',borderRadius:12,padding:14}}><small style={{color:'#176b67',fontWeight:800}}>{s.toUpperCase()}</small><h4 style={{margin:'8px 0 4px'}}>{c} · {n}</h4><div style={{fontSize:12,color:'#687386'}}>Avanzamento {p}</div><div style={{height:7,background:'#edf0f3',borderRadius:10,marginTop:9}}><div style={{height:7,width:p,background:'#176b67',borderRadius:10}}/></div></div>)}</div></div>
      <div style={{marginTop:16,background:'#fff',border:'1px solid #e7eaf0',borderRadius:14,padding:18}}><h3 style={{marginTop:0}}>Riunione settimanale</h3><div style={{display:'flex',gap:24,color:'#687386',fontSize:13}}><span><b style={{color:'#18212f'}}>42</b> completate</span><span><b style={{color:'#18212f'}}>8</b> in corso</span><span><b style={{color:'#c98427'}}>4</b> in ritardo</span><span><b style={{color:'#c7463f'}}>2</b> blocchi</span></div></div>
    </div>
  );
}
