import ViscontiWeeklyMeetingV3 from "@/components/ViscontiWeeklyMeetingV3";
import { getViscontiWorkData } from "@/lib/visconti-work-data";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Riunione settimanale · Visconti Work V2", description: "Organizzazione, controllo e avanzamento del lavoro interno" };

export default async function MeetingsPage(){
  const [workData, taskData] = await Promise.all([getViscontiWorkData(), getViscontiTaskData()]);
  const data = {
    ...workData,
    tasks: taskData.tasks || [],
    members: taskData.members?.length ? taskData.members : workData.members || [],
  };
  return <ViscontiWeeklyMeetingV3 data={data}/>;
}
