import { notFound } from "next/navigation";
import { CitizenDossierView } from "@/components/doj/CitizenDossierView";
import { getDossierById } from "@/lib/data/doj-dossiers";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DojDossierPage({ params }: Props) {
  const { id } = await params;
  const dossier = getDossierById(id);
  if (!dossier) notFound();
  return <CitizenDossierView dossier={dossier} />;
}
