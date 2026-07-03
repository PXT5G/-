import { botFetch, isDiscordBotConfigured } from "@/lib/discord/api-client";
import { getDossierById, searchDossiers, citizenDossiers } from "@/lib/data/doj-dossiers";
import type { CitizenDossier } from "@/types/doj-dossier";
import type { SearchMode } from "@/lib/data/doj-dossiers";

export async function fetchDossierById(id: string): Promise<CitizenDossier | undefined> {
  if (isDiscordBotConfigured()) {
    const res = await botFetch<{ citizen: CitizenDossier }>(`/api/citizens/${id}`);
    if (res.ok && res.data.citizen) return res.data.citizen;
  }
  return getDossierById(id);
}

export async function fetchDossierSearch(
  query: string,
  mode: SearchMode,
): Promise<CitizenDossier[]> {
  if (isDiscordBotConfigured() && query.trim()) {
    const res = await botFetch<{ results: CitizenDossier[] }>(
      `/api/citizens/search?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}`,
    );
    if (res.ok) return res.data.results;
  }
  return query.trim() ? searchDossiers(query, mode) : citizenDossiers;
}
