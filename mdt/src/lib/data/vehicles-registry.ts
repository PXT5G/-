import { citizenDossiers } from "@/lib/data/doj-dossiers";

export interface RegistryVehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
  owner: string;
  ownerId: string;
  registeredAt: string;
  status: string;
}

export const registryVehicles: RegistryVehicle[] = citizenDossiers.flatMap((d) =>
  d.vehicles.map((v) => ({
    id: v.id,
    plate: v.plate,
    model: v.model,
    color: v.color,
    owner: d.fullName,
    ownerId: d.id,
    registeredAt: v.registeredAt,
    status: v.status,
  })),
);

export function searchVehicles(query: string): RegistryVehicle[] {
  const q = query.trim().toLowerCase();
  if (!q) return registryVehicles;
  return registryVehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.owner.toLowerCase().includes(q) ||
      v.color.includes(q),
  );
}
