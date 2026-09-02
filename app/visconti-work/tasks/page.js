import ViscontiTaskBoardTernaV2 from "@/components/ViscontiTaskBoardTernaV2";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const metadata = {
  title: "Attività · Visconti Work V2",
  description: "Coda operativa e scadenze di connessione di Gruppo Visconti",
};

export default async function TasksPage() {
  const data = await getViscontiTaskData();
  return <ViscontiTaskBoardTernaV2 {...data} />;
}
