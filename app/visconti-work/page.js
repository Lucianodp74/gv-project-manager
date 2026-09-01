import ViscontiWorkLiveDashboard from "@/components/ViscontiWorkLiveDashboard";
import { getViscontiWorkData } from "@/lib/visconti-work-data";

export const metadata = {
  title: "Visconti Work V2",
  description: "Gruppo Visconti — project operations control tower",
};

export default async function ViscontiWorkPage() {
  const data = await getViscontiWorkData();
  return <ViscontiWorkLiveDashboard data={data} />;
}
