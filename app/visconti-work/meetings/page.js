import ViscontiWeeklyMeetingV4 from "@/components/ViscontiWeeklyMeetingV4";
import ViscontiWeeklyResponsibilityBoardV2 from "@/components/ViscontiWeeklyResponsibilityBoardV2";
import ViscontiWeeklyTaskAssignment from "@/components/ViscontiWeeklyTaskAssignment";
import { getViscontiWorkData } from "@/lib/visconti-work-data";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Riunione settimanale · Visconti Work V2", description: "Piano operativo settimanale, controllo collaboratori e verifica del lunedì" };

export default async function MeetingsPage(){
  const [workResult, taskResult] = await Promise.allSettled([getViscontiWorkData(), getViscontiTaskData()]);
  const workData = workResult.status === "fulfilled" ? workResult.value : {};
  const taskData = taskResult.status === "fulfilled" ? taskResult.value : {};
  const data = { ...workData, tasks: taskData.tasks || [], members: taskData.members?.length ? taskData.members : workData.members || [] };
  return <>
    <ViscontiWeeklyResponsibilityBoardV2 tasks={data.tasks} members={data.members}/>
    <ViscontiWeeklyTaskAssignment members={data.members} projects={data.projects || []}/>
    <ViscontiWeeklyMeetingV4 data={data}/>
  </>;
}
