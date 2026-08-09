import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { hashPassword } from "./password";

export type MemberRole = "admin" | "member";

export interface Member {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: MemberRole;
  createdAt: string;
}

export type MemberPublic = Omit<Member, "passwordHash" | "salt">;

interface Store {
  members: Member[];
}

const dataDir = path.join(process.cwd(), "data");
const membersPath = path.join(dataDir, "members.json");
const secretPath = path.join(dataDir, "secret");

function writeStore(store: Store) {
  const tmp = `${membersPath}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2));
  renameSync(tmp, membersPath);
}

function bootstrap() {
  mkdirSync(dataDir, { recursive: true });
  if (existsSync(membersPath)) return;

  const adminEmail = process.env.ADMIN_EMAIL || "admin@tambola.local";
  const adminPassword = process.env.ADMIN_PASSWORD || randomBytes(6).toString("hex");
  const { hash, salt } = hashPassword(adminPassword);
  const admin: Member = {
    id: randomBytes(8).toString("hex"),
    name: "Administrator",
    email: adminEmail.toLowerCase(),
    passwordHash: hash,
    salt,
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  writeStore({ members: [admin] });

  if (!process.env.ADMIN_PASSWORD) {
    console.log(
      `\n[auth] Created the first admin account.\n` +
        `       Email:    ${adminEmail}\n` +
        `       Password: ${adminPassword}\n` +
        `       Set ADMIN_EMAIL / ADMIN_PASSWORD in .env.local and delete data/ to change it.\n`
    );
  } else {
    console.log(`[auth] Admin account created: ${adminEmail}`);
  }
}

function loadStore(): Store {
  bootstrap();
  try {
    const raw = readFileSync(membersPath, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return { members: [] };
  }
}

function saveStore(store: Store) {
  mkdirSync(dataDir, { recursive: true });
  writeStore(store);
}

function toPublic(m: Member): MemberPublic {
  return { id: m.id, name: m.name, email: m.email, role: m.role, createdAt: m.createdAt };
}

export function listMembers(): MemberPublic[] {
  return loadStore().members.map(toPublic);
}

export function getMemberByEmail(email: string): Member | null {
  const wanted = email.toLowerCase();
  return loadStore().members.find((m) => m.email === wanted) || null;
}

export function getMemberById(id: string): Member | null {
  return loadStore().members.find((m) => m.id === id) || null;
}

export function addMember(input: {
  name: string;
  email: string;
  password: string;
  role: MemberRole;
}): MemberPublic | { error: string } {
  const store = loadStore();
  const email = input.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (store.members.some((m) => m.email === email)) {
    return { error: `A member already exists with ${email}.` };
  }
  const { hash, salt } = hashPassword(input.password);
  const member: Member = {
    id: randomBytes(8).toString("hex"),
    name: input.name.trim() || email.split("@")[0],
    email,
    passwordHash: hash,
    salt,
    role: input.role === "admin" ? "admin" : "member",
    createdAt: new Date().toISOString(),
  };
  store.members.push(member);
  saveStore(store);
  return toPublic(member);
}

export function deleteMember(id: string): { error?: string } {
  const store = loadStore();
  const target = store.members.find((m) => m.id === id);
  if (!target) return { error: "Member not found." };
  if (target.role === "admin" && store.members.filter((m) => m.role === "admin").length <= 1) {
    return { error: "Cannot remove the last admin." };
  }
  store.members = store.members.filter((m) => m.id !== id);
  saveStore(store);
  return {};
}

export function setMemberPassword(id: string, password: string): { error?: string } {
  const store = loadStore();
  const member = store.members.find((m) => m.id === id);
  if (!member) return { error: "Member not found." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  const { hash, salt } = hashPassword(password);
  member.passwordHash = hash;
  member.salt = salt;
  saveStore(store);
  return {};
}

export function getSessionSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  mkdirSync(dataDir, { recursive: true });
  if (!existsSync(secretPath)) {
    writeFileSync(secretPath, randomBytes(32).toString("hex"));
  }
  return readFileSync(secretPath, "utf8").trim();
}
