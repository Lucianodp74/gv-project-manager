import ViscontiTaskBoardV2 from "@/components/ViscontiTaskBoardV2";
import ViscontiRequestTracking from "@/components/ViscontiRequestTracking";
import ViscontiTeamMembersPanel from "@/components/ViscontiTeamMembersPanel";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Attività · Visconti Work V2",
  description: "Coda operativa unica di Gruppo Visconti",
};

export default async function TasksPage() {
  const data = await getViscontiTaskData();
  return <><ViscontiTaskBoardV2 {...data} /><ViscontiRequestTracking tasks={data.tasks || []} /><div style={{maxWidth:1440,margin:"0 auto",padding:"0 34px 40px"}}><ViscontiTeamMembersPanel members={data.members || []} /></div></>;
}
