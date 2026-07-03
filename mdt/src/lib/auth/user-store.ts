import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { AuditEntry, AuthAccount, OfficerProfile, SystemSettings } from "./types";
import { ROLE_PERMISSIONS } from "./permissions";

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");
const AUDIT_FILE = join(DATA_DIR, "audit.json");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

interface UsersFile {
  users: AuthAccount[];
}

interface AuditFile {
  entries: AuditEntry[];
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function seedUsers(): AuthAccount[] {
  const now = new Date().toISOString();
  const mk = (
    username: string,
    plainPassword: string,
    officer: OfficerProfile,
    role: AuthAccount["role"],
  ): AuthAccount => ({
    id: randomUUID(),
    username,
    passwordHash: bcrypt.hashSync(plainPassword, 10),
    officer,
    role,
    permissions: [...ROLE_PERMISSIONS[role]],
    active: true,
    createdAt: now,
  });

  return [
    mk(
      "admin",
      "Admin@2026!",
      {
        id: "off-admin",
        name: "مدير النظام",
        rank: "Command",
        department: "LSPD",
        callsign: "CMD-01",
        badges: ["Command"],
        hours: 0,
      },
      "super_admin",
    ),
    mk(
      "jcarter",
      "Lspd@1234",
      {
        id: "off-001",
        name: "James Carter",
        rank: "Sergeant",
        department: "LSPD",
        callsign: "1-L-12",
        badges: ["FTO", "SWAT"],
        hours: 142,
      },
      "officer",
    ),
    mk(
      "tbradley",
      "Command@1234",
      {
        id: "off-005",
        name: "Tom Bradley",
        rank: "Lieutenant",
        department: "LSPD",
        callsign: "1-C-01",
        badges: ["Command", "FTO"],
        hours: 320,
      },
      "admin",
    ),
    mk(
      "smitchell",
      "Lspd@5678",
      {
        id: "off-002",
        name: "Sarah Mitchell",
        rank: "Officer",
        department: "LSPD",
        callsign: "1-A-10",
        badges: ["K9"],
        hours: 98,
      },
      "supervisor",
    ),
  ];
}

function readUsers(): AuthAccount[] {
  ensureDataDir();
  if (!existsSync(USERS_FILE)) {
    const users = seedUsers();
    writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
    return users;
  }
  const raw = JSON.parse(readFileSync(USERS_FILE, "utf-8")) as UsersFile;
  return raw.users;
}

function writeUsers(users: AuthAccount[]) {
  ensureDataDir();
  writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
  // Discord Bot API: POST /sync/users — mirror account changes to Discord-backed DB
}

export function getAllAccounts(): AuthAccount[] {
  return readUsers();
}

export function getAccountByUsername(username: string): AuthAccount | undefined {
  return readUsers().find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
}

export function getAccountById(id: string): AuthAccount | undefined {
  return readUsers().find((u) => u.id === id);
}

export function verifyPassword(account: AuthAccount, password: string): boolean {
  return bcrypt.compareSync(password, account.passwordHash);
}

export function updateLastLogin(id: string) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  users[idx].lastLogin = new Date().toISOString();
  writeUsers(users);
}

export function createAccount(
  data: Omit<AuthAccount, "id" | "passwordHash" | "createdAt" | "lastLogin"> & {
    password: string;
  },
): AuthAccount {
  const users = readUsers();
  if (users.some((u) => u.username.toLowerCase() === data.username.toLowerCase())) {
    throw new Error("USERNAME_EXISTS");
  }
  const account: AuthAccount = {
    id: randomUUID(),
    username: data.username,
    passwordHash: bcrypt.hashSync(data.password, 10),
    officer: data.officer,
    role: data.role,
    permissions: data.permissions,
    active: data.active,
    createdAt: new Date().toISOString(),
  };
  users.push(account);
  writeUsers(users);
  return account;
}

export function updateAccount(
  id: string,
  patch: Partial<
    Pick<AuthAccount, "username" | "role" | "permissions" | "active" | "officer">
  > & { password?: string },
): AuthAccount | null {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const current = users[idx];
  users[idx] = {
    ...current,
    ...patch,
    passwordHash: patch.password
      ? bcrypt.hashSync(patch.password, 10)
      : current.passwordHash,
  };
  writeUsers(users);
  return users[idx];
}

export function deleteAccount(id: string): boolean {
  const users = readUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  writeUsers(filtered);
  return true;
}

export function getAuditLog(limit = 100): AuditEntry[] {
  ensureDataDir();
  if (!existsSync(AUDIT_FILE)) {
    writeFileSync(AUDIT_FILE, JSON.stringify({ entries: [] }));
    return [];
  }
  const raw = JSON.parse(readFileSync(AUDIT_FILE, "utf-8")) as AuditFile;
  return raw.entries.slice(0, limit);
}

export function appendAudit(entry: Omit<AuditEntry, "id" | "timestamp">) {
  ensureDataDir();
  const entries = getAuditLog(500);
  const full: AuditEntry = {
    ...entry,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const next = [full, ...entries].slice(0, 500);
  writeFileSync(AUDIT_FILE, JSON.stringify({ entries: next }, null, 2));
  // Discord Bot API: POST /logs/audit — stream audit events to Discord webhook
}

const DEFAULT_SETTINGS: SystemSettings = {
  mdtLockdown: false,
  maintenanceMode: false,
  sessionTimeoutMinutes: 480,
  maxLoginAttempts: 5,
  requireOnDutyForDispatch: false,
};

export function getSystemSettings(): SystemSettings {
  ensureDataDir();
  if (!existsSync(SETTINGS_FILE)) {
    writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(SETTINGS_FILE, "utf-8")) };
}

export function updateSystemSettings(patch: Partial<SystemSettings>): SystemSettings {
  const next = { ...getSystemSettings(), ...patch };
  writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2));
  return next;
}
