import ViscontiProjectDetailV2 from "@/components/ViscontiProjectDetailV2";
import ViscontiProjectOperationalSummary from "@/components/ViscontiProjectOperationalSummary";
import ViscontiProjectListV2 from "@/components/ViscontiProjectListV2";
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
    return <><ViscontiProjectOperationalSummary projectId={params.id} /><ViscontiProjectDetailV2 /></>;
  }
  const data = await getViscontiWorkData();
  return <ViscontiProjectListV2 projects={data.projects} connected={data.connected} />;
}
