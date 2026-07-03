export interface RegistryWeapon {
  id: string;
  serial: string;
  type: string;
  owner: string;
  ownerId: string;
  registeredAt: string;
  status: "مسجّل" | "معلّق" | "مسروق";
}

export const registryWeapons: RegistryWeapon[] = [
  { id: "wpn-1", serial: "LS-928471-W1", type: "مسدس 9mm", owner: "Marcus Webb", ownerId: "doss-001", registeredAt: "2023-05-10", status: "معلّق" },
  { id: "wpn-2", serial: "LS-441209-W1", type: "مسدس .45", owner: "Elena Voss", ownerId: "doss-002", registeredAt: "2024-01-15", status: "مسجّل" },
  { id: "wpn-3", serial: "LS-102938-W1", type: "بندقية صيد", owner: "Franklin Clinton", ownerId: "doss-003", registeredAt: "2022-08-20", status: "مسجّل" },
  { id: "wpn-4", serial: "UNK-99281", type: "رشاش AK", owner: "غير معروف", ownerId: "", registeredAt: "—", status: "مسروق" },
];

export function searchWeapons(query: string): RegistryWeapon[] {
  const q = query.trim().toLowerCase();
  if (!q) return registryWeapons;
  return registryWeapons.filter(
    (w) =>
      w.serial.toLowerCase().includes(q) ||
      w.type.includes(q) ||
      w.owner.toLowerCase().includes(q),
  );
}
