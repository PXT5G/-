import { notFound } from "next/navigation";
import { CitizenDossierView } from "@/components/doj/CitizenDossierView";
import { fetchDossierById } from "@/lib/discord/dossier-service";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DojDossierPage({ params }: Props) {
  const { id } = await params;
  const dossier = await fetchDossierById(id);
  if (!dossier) notFound();
  return <CitizenDossierView dossier={dossier} />;
}
