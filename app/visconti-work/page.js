import ViscontiDirectorControlTower from "@/components/ViscontiDirectorControlTower";
import { getViscontiControlTowerData } from "@/lib/visconti-control-tower-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Visconti Work V2",
  description: "Gruppo Visconti — project operations control tower",
};

export default async function ViscontiWorkPage() {
  const data = await getViscontiControlTowerData();
  return <ViscontiDirectorControlTower data={data} />;
}
