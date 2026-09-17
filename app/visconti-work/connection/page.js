import ViscontiConnectionDetailV2 from "@/components/ViscontiConnectionDetailV2";
import ViscontiConnectionControlTower from "@/components/ViscontiConnectionControlTower";
import ViscontiConnectionMilestoneEditor from "@/components/ViscontiConnectionMilestoneEditor";
import ViscontiConnectionWorkflowGuard from "@/components/ViscontiConnectionWorkflowGuard";
import ViscontiTeamMembersPanel from "@/components/ViscontiTeamMembersPanel";
import ViscontiConnectionListV2 from "@/components/ViscontiConnectionListV2";
import connectionStyles from "./connection-overrides.module.css";
import { getViscontiConnectionData, getViscontiConnectionsData } from "@/lib/visconti-work-data";

export const metadata = { title: "Connessioni · Visconti Work V2", description: "Gestione operativa delle pratiche di connessione — Gruppo Visconti" };

export default async function ConnectionPage({ searchParams }) {
  const params = await searchParams;
  if (!params?.practice && !params?.project) {
    const data = await getViscontiConnectionsData();
    return <ViscontiConnectionListV2 connections={data.connections} connected={data.connected} />;
  }
  const data = await getViscontiConnectionData(params?.practice || null, params?.project || null);
  const showFullDetail = params?.detail === "full";
  return <div className={connectionStyles.connectionFix}>
    <ViscontiConnectionControlTower data={data.controlTower} />
    <ViscontiConnectionMilestoneEditor practice={data.practice} />
    <ViscontiTeamMembersPanel members={data.members} />
    <ViscontiConnectionWorkflowGuard practice={data.practice} steps={data.steps} members={data.members} />
    {!showFullDetail && data.practice && <div style={{ maxWidth: 1320, margin: "0 auto 18px", padding: "0 34px", textAlign: "right" }}><a href={`/visconti-work/connection?practice=${encodeURIComponent(data.practice.id)}&detail=full`} style={{ color: "#687181", fontSize: 11, textDecoration: "none" }}>Apri dettaglio completo →</a></div>}
    {showFullDetail && <ViscontiConnectionDetailV2 practice={data.practice} deadlines={data.deadlines} steps={data.steps} />}
  </div>;
}