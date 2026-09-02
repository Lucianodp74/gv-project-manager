import ViscontiTaskBoardV2 from "@/components/ViscontiTaskBoardV2";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const metadata = {
  title: "Attività · Visconti Work V2",
  description: "Coda operativa di Gruppo Visconti",
};

export default async function TasksPage() {
  const data = await getViscontiTaskData();
  return <ViscontiTaskBoardV2 {...data} />;
}
