export interface DossierVehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
  registeredAt: string;
  status: "مسجّل" | "مسروق" | "مطلوب";
  image?: string;
}

export interface DossierProperty {
  id: string;
  label: string;
  address: string;
  type: string;
  value: number;
  purchasedAt: string;
  image?: string;
}

export interface DossierTransaction {
  id: string;
  type: "إيداع" | "سحب" | "غرامة" | "تحويل";
  amount: number;
  date: string;
  note: string;
}

export interface DossierRecord {
  id: string;
  type: string;
  description: string;
  date: string;
  officer?: string;
}

export interface CitizenDossier {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dob: string;
  phone: string;
  email?: string;
  address: string;
  photoSeed: string;
  flags: string[];
  licenses: string[];
  bankBalance: number;
  finesOwed: number;
  warrants: number;
  vehicles: DossierVehicle[];
  properties: DossierProperty[];
  transactions: DossierTransaction[];
  records: DossierRecord[];
  notes?: string;
}
