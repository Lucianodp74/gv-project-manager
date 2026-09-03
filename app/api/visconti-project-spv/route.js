const SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";
const SELECT = "id,name,go_no_go_status,go_no_go_date,go_no_go_notes,spv_name,spv_status,spv_vat_number,spv_tax_code,spv_pec,spv_registered_office,spv_incorporation_date,connection_holder,connection_transfer_status,connection_transfer_request_date,connection_transfer_completed_date,connection_transfer_protocol,spv_notes";

async function parse(response) {
  const text = await response.text(); let data=null; try { data=text?JSON.parse(text):null; } catch (_) {}
  if (!response.ok) throw new Error(data?.message || data?.error || data?.hint || `Supabase ${response.status}`);
  return data;
}

export async function GET(request) {
  try {
    const projectId = String(new URL(request.url).searchParams.get("projectId") || "");
    if (!projectId) return Response.json({error:"ProjectId mancante"},{status:400});
    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&select=${SELECT}&limit=1`, {headers:{apikey:SUPABASE_KEY},cache:"no-store"});
    const rows = await parse(response);
    if (!rows?.length) return Response.json({error:"Progetto non trovato"},{status:404});
    return Response.json(rows[0]);
  } catch(error) { console.error("visconti-project-spv GET",error); return Response.json({error:error instanceof Error?error.message:"Lettura non riuscita"},{status:500}); }
}

export async function POST(request) {
  try {
    const body = await request.json(); const projectId=String(body?.projectId||""); const fields=body?.fields;
    if (!projectId || !fields || typeof fields!=="object" || Array.isArray(fields)) return Response.json({error:"Parametri non validi"},{status:400});
    const allowed=["spv_name","spv_vat_number","spv_tax_code","spv_pec","spv_registered_office","spv_incorporation_date","spv_status","connection_transfer_protocol","connection_transfer_request_date","connection_transfer_completed_date","connection_transfer_status","connection_holder","spv_notes"];
    const clean=Object.fromEntries(Object.entries(fields).filter(([key])=>allowed.includes(key)));
    if(!Object.keys(clean).length) return Response.json({error:"Nessun campo valido"},{status:400});
    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/visconti_project_spv_update`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({p_project_id:projectId,p_fields:clean}),cache:"no-store"});
    const data=await parse(response); return Response.json(data??{ok:true},{status:200});
  } catch(error) { console.error("visconti-project-spv POST",error); return Response.json({error:error instanceof Error?error.message:"Operazione non riuscita"},{status:500}); }
}
