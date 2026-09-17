import ViscontiDocumentBoard from "@/components/ViscontiDocumentBoard";
import { getViscontiDocumentData } from "@/lib/visconti-document-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Documenti · Visconti Work V2",
  description: "Archivio operativo dei documenti di progetto — Gruppo Visconti",
};

export default async function DocumentsPage() {
  const data = await getViscontiDocumentData();
  return <ViscontiDocumentBoard {...data} />;
}
