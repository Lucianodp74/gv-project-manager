import ViscontiConnectionV2 from "@/components/ViscontiConnectionV2";
import { getViscontiConnectionData } from "@/lib/visconti-work-data";

export const metadata = {
  title: "Connessione · Visconti Work V2",
  description: "Monitoraggio operativo delle connessioni — Gruppo Visconti",
};

export default async function ConnectionPage({ searchParams }) {
  const params = await searchParams;
  const data = await getViscontiConnectionData(params?.practice || null, params?.project || null);

  return (
    <ViscontiConnectionV2
      practice={data.practice}
      deadlines={data.deadlines}
      stepsData={data.steps}
    />
  );
}
