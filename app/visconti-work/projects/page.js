import ViscontiProjectDetailV2 from "@/components/ViscontiProjectDetailV2";
import ViscontiProjectActionFrame from "@/components/ViscontiProjectActionFrame";
import ViscontiProjectListV2 from "@/components/ViscontiProjectListV2";
import ViscontiProjectSpvWorkflow from "@/components/ViscontiProjectSpvWorkflow";
import ViscontiNewProject from "@/components/ViscontiNewProject";
import { getViscontiWorkData } from "@/lib/visconti-work-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Progetti · Visconti Work V2",
  description: "Portafoglio operativo di progetto — Gruppo Visconti",
};

export default async function ProjectPage({ searchParams }) {
  const params = await searchParams;
  if (params?.id) {
    return <><ViscontiProjectActionFrame projectId={params.id} /><ViscontiProjectSpvWorkflow projectId={params.id} /><ViscontiProjectDetailV2 /></>;
  }
  const data = await getViscontiWorkData({ includeArchived: true });
  return <><div style={{maxWidth:1480,margin:"0 auto",padding:"18px 34px 0",display:"flex",justifyContent:"flex-end"}}><ViscontiNewProject members={data.members} /></div><ViscontiProjectListV2 projects={data.projects} connected={data.connected} /> </>;
}
