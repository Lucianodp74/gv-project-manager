import ViscontiDeadlineBoard from "@/components/ViscontiDeadlineBoard";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Scadenze · Visconti Work V2", description: "Vista unica delle scadenze operative" };

export default async function DeadlinesPage(){
  const data = await getViscontiTaskData();
  return <ViscontiDeadlineBoard {...data}/>;
}
