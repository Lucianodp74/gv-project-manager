import ViscontiTaskBoardV2 from "@/components/ViscontiTaskBoardV2";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Attività · Visconti Work V2",
  description: "Coda operativa unica di Gruppo Visconti",
};

export default async function TasksPage() {
  const data = await getViscontiTaskData();
  return <ViscontiTaskBoardV2 {...data} />;
}
