import ViscontiWeeklyMeeting from "@/components/ViscontiWeeklyMeeting";
import { getViscontiWorkData } from "@/lib/visconti-work-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Riunione settimanale · Visconti Work V2", description: "Preparazione operativa della riunione settimanale" };

export default async function MeetingsPage(){
  const data = await getViscontiWorkData();
  return <ViscontiWeeklyMeeting data={data}/>;
}
