import ViscontiWeeklyWorkBoard from "@/components/ViscontiWeeklyWorkBoard";
import { getViscontiWorkData } from "@/lib/visconti-work-data";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Lavoro della settimana · Visconti Work",
  description: "Regia operativa settimanale del Gruppo Visconti",
};

export default async function WeeklyWorkPage() {
  const [workResult, taskResult] = await Promise.allSettled([getViscontiWorkData(), getViscontiTaskData()]);
  const work = workResult.status === "fulfilled" ? workResult.value : {};
  const task = taskResult.status === "fulfilled" ? taskResult.value : {};
  return <ViscontiWeeklyWorkBoard tasks={task.tasks || []} members={task.members?.length ? task.members : work.members || []} projects={work.projects || []} />;
}
