import ViscontiProjectActionFrame from "@/components/ViscontiProjectActionFrame";
import ViscontiProjectCompanyCard from "@/components/ViscontiProjectCompanyCard";
import ViscontiProjectDetailV2 from "@/components/ViscontiProjectDetailV2";
import ViscontiProjectListV2 from "@/components/ViscontiProjectListV2";
import ViscontiProjectSocietaryWorkflow from "@/components/ViscontiProjectSocietaryWorkflow";
import ViscontiProjectPowerEditor from "@/components/ViscontiProjectPowerEditor";
import ViscontiProjectExternalProfessionals from "@/components/ViscontiProjectExternalProfessionals";
import ViscontiNewProjectV2 from "@/components/ViscontiNewProjectV2";
import { getViscontiWorkData } from "@/lib/visconti-work-data";
export const revalidate=15;
export const metadata={title:"Progetti · Visconti Work V2",description:"Portafoglio operativo di progetto — Gruppo Visconti"};
export default async function ProjectPage({searchParams}){const params=await searchParams;if(params?.id)return <><ViscontiProjectActionFrame projectId={params.id}/><ViscontiProjectCompanyCard projectId={params.id}/><ViscontiProjectSocietaryWorkflow projectId={params.id}/><ViscontiProjectPowerEditor/><ViscontiProjectExternalProfessionals projectId={params.id}/><ViscontiProjectDetailV2/></>;const data=await getViscontiWorkData({includeArchived:true});return <><div style={{maxWidth:1480,margin:"0 auto",padding:"18px 34px 0",display:"flex",justifyContent:"flex-end"}}><ViscontiNewProjectV2 members={data.members}/></div><ViscontiProjectListV2 projects={data.projects} connected={data.connected}/></>;}
