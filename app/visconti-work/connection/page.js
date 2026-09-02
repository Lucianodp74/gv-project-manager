import ViscontiConnectionDetailV2 from "@/components/ViscontiConnectionDetailV2";
import ViscontiConnectionControlTower from "@/components/ViscontiConnectionControlTower";
import ViscontiConnectionMilestoneEditor from "@/components/ViscontiConnectionMilestoneEditor";
import ViscontiConnectionWorkflowBuilder from "@/components/ViscontiConnectionWorkflowBuilder";
import ViscontiConnectionListV2 from "@/components/ViscontiConnectionListV2";
import { getViscontiConnectionData, getViscontiConnectionsData } from "@/lib/visconti-work-data";

export const metadata = {
  title: "Connessioni · Visconti Work V2",
  description: "Gestione operativa delle pratiche di connessione — Gruppo Visconti",
};

export default async function ConnectionPage({ searchParams }) {
  const params = await searchParams;
  if (!params?.practice && !params?.project) {
    const data = await getViscontiConnectionsData();
    return <ViscontiConnectionListV2 connections={data.connections} connected={data.connected} />;
  }
  const data = await getViscontiConnectionData(params?.practice || null, params?.project || null);
  return <>
    <ViscontiConnectionControlTower data={data.controlTower} />
    <ViscontiConnectionMilestoneEditor practice={data.practice} />
    <ViscontiConnectionWorkflowBuilder practice={data.practice} steps={data.steps} />
    <ViscontiConnectionDetailV2 practice={data.practice} deadlines={data.deadlines} steps={data.steps} />
  </>;
}
