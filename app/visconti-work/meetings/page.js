import ViscontiWeeklyMeetingV4 from "@/components/ViscontiWeeklyMeetingV4";
import { getViscontiWorkData } from "@/lib/visconti-work-data";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Riunione settimanale · Visconti Work V2", description: "Piano operativo settimanale, controllo collaboratori e verifica del lunedì" };

export default async function MeetingsPage(){
  const [workData, taskData] = await Promise.all([getViscontiWorkData(), getViscontiTaskData()]);
  const data = { ...workData, tasks: taskData.tasks || [], members: taskData.members?.length ? taskData.members : workData.members || [] };
  return <ViscontiWeeklyMeetingV4 data={data}/>;
}
