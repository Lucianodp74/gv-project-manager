import ViscontiWeeklyMeetingV5 from "@/components/ViscontiWeeklyMeetingV5";
import ViscontiMeetingDiscussionPanel from "@/components/ViscontiMeetingDiscussionPanel";
import ViscontiMeetingActionsEditor from "@/components/ViscontiMeetingActionsEditor";
import { getViscontiWorkData } from "@/lib/visconti-work-data";
import { getViscontiTaskData } from "@/lib/visconti-task-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Riunione settimanale · Visconti Work",
  description: "Regia settimanale: verifica, discussione, decisioni, incarichi e controllo della settimana successiva",
};

export default async function MeetingsPage() {
  const [workResult, taskResult] = await Promise.allSettled([
    getViscontiWorkData(),
    getViscontiTaskData(),
  ]);
  const workData = workResult.status === "fulfilled" ? workResult.value : {};
  const taskData = taskResult.status === "fulfilled" ? taskResult.value : {};
  const data = {
    ...workData,
    tasks: taskData.tasks || [],
    members: taskData.members?.length ? taskData.members : workData.members || [],
  };

  return <>
    <ViscontiMeetingDiscussionPanel projects={data.projects || []} members={data.members || []} />
    <ViscontiWeeklyMeetingV5 data={data} />
    <ViscontiMeetingActionsEditor projects={data.projects || []} members={data.members || []} />
  </>;
}
