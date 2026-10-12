import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { get as blobGet, put as blobPut } from "@vercel/blob";
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
  /** Bumped on password reset — older session tokens stop verifying. */
  sessionVersion?: number;
}

export type MemberPublic = Omit<Member, "passwordHash" | "salt">;

interface Store {
  members: Member[];
}

const dataDir = path.join(process.cwd(), "data");
const membersPath = path.join(dataDir, "members.json");
const secretPath = path.join(dataDir, "secret");

const BLOB_MEMBERS_PATH = "tambola/members.json";
const BLOB_SECRET_PATH = "tambola/secret.txt";

// Vercel Blob is used whenever a blob store is connected (BLOB_READ_WRITE_TOKEN
// is added to the project env when you create + connect a store). Locally we
// fall back to the gitignored data/ directory.
function usingBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlob(pathname: string): Promise<string | null> {
  const result = await blobGet(pathname, { access: "private", useCache: false });
  if (!result) return null;
  return new Response(result.stream).text();
}

async function writeBlob(pathname: string, body: string, contentType: string): Promise<void> {
  await blobPut(pathname, body, {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function writeFileAtomic(filePath: string, content: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  writeFileSync(tmp, content);
  renameSync(tmp, filePath);
}

function toPublic(m: Member): MemberPublic {
  return { id: m.id, name: m.name, email: m.email, role: m.role, createdAt: m.createdAt };
}

// Mutations are serialized so concurrent admin operations (add/remove/reset)
// can't interleave a load-modify-write and clobber each other.
let storeQueue: Promise<unknown> = Promise.resolve();
function withStoreWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = storeQueue.then(fn);
  storeQueue = next.catch(() => undefined);
  return next;
}

async function readStore(): Promise<string | null> {
  if (usingBlobStore()) return readBlob(BLOB_MEMBERS_PATH);
  return existsSync(membersPath) ? readFileSync(membersPath, "utf8") : null;
}

async function writeStore(store: Store): Promise<void> {
  const raw = JSON.stringify(store, null, 2);
  if (usingBlobStore()) {
    await writeBlob(BLOB_MEMBERS_PATH, raw, "application/json");
  } else {
    writeFileAtomic(membersPath, raw);
  }
}

async function bootstrap(): Promise<Store> {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tambola.local";
  // Never bootstrap a weak or well-known password. Fall back to a random one
  // (not printed) and tell the operator how to set a known password.
  const WEAK_PASSWORDS = new Set([
    "change-me", "changeme", "password", "password123", "admin", "admin123",
    "letmein", "tambola", "qwerty", "123456",
  ]);
  const provided = process.env.ADMIN_PASSWORD;
  const providedIsStrong =
    !!provided && provided.length >= 6 && !WEAK_PASSWORDS.has(provided.toLowerCase());
  if (provided && !providedIsStrong) {
    console.warn("[auth] Ignoring weak ADMIN_PASSWORD (min 6 chars, no common defaults).");
  }
  const adminPassword =
    providedIsStrong && provided ? provided : randomBytes(12).toString("hex");
  const { hash, salt } = hashPassword(adminPassword);
  const store: Store = {
    members: [
      {
        id: randomBytes(8).toString("hex"),
        name: "Administrator",
        email: adminEmail.toLowerCase(),
        passwordHash: hash,
        salt,
        role: "admin",
        createdAt: new Date().toISOString(),
        sessionVersion: 0,
      },
    ],
  };
  await writeStore(store);
  console.log(`[auth] Admin account created: ${adminEmail}`);
  if (!providedIsStrong) {
    console.log(
      "[auth] A random admin password was generated (not shown). " +
        "Set a strong ADMIN_PASSWORD and delete the members store to use a known password."
    );
  }
  return store;
}

async function loadStore(): Promise<Store> {
  const raw = await readStore();
  if (raw) {
    try {
      return JSON.parse(raw) as Store;
    } catch {
      throw new Error("[auth] Member store is corrupted. Delete data/members.json (or the tambola/members.json blob) to re-bootstrap.");
    }
  }
  return bootstrap();
}

export async function listMembers(): Promise<MemberPublic[]> {
  const store = await loadStore();
  return store.members.map(toPublic);
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const wanted = email.toLowerCase();
  const store = await loadStore();
  return store.members.find((m) => m.email === wanted) || null;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const store = await loadStore();
  return store.members.find((m) => m.id === id) || null;
}

export async function addMember(input: {
  name: string;
  email: string;
  password: string;
  role: MemberRole;
}): Promise<MemberPublic | { error: string }> {
  const email = input.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  return withStoreWrite(async () => {
    const store = await loadStore();
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
      sessionVersion: 0,
    };
    store.members.push(member);
    await writeStore(store);
    return toPublic(member);
  });
}

export async function deleteMember(id: string): Promise<{ error?: string }> {
  return withStoreWrite(async () => {
    const store = await loadStore();
    const target = store.members.find((m) => m.id === id);
    if (!target) return { error: "Member not found." };
    if (target.role === "admin" && store.members.filter((m) => m.role === "admin").length <= 1) {
      return { error: "Cannot remove the last admin." };
    }
    store.members = store.members.filter((m) => m.id !== id);
    await writeStore(store);
    return {};
  });
}

export async function setMemberPassword(id: string, password: string): Promise<{ error?: string }> {
  return withStoreWrite(async () => {
    const store = await loadStore();
    const member = store.members.find((m) => m.id === id);
    if (!member) return { error: "Member not found." };
    if (password.length < 6) return { error: "Password must be at least 6 characters." };
    const { hash, salt } = hashPassword(password);
    member.passwordHash = hash;
    member.salt = salt;
    // Kill all existing sessions for this member.
    member.sessionVersion = (member.sessionVersion ?? 0) + 1;
    await writeStore(store);
    return {};
  });
}

export async function getSessionSecret(): Promise<string> {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (usingBlobStore()) {
    const existing = await readBlob(BLOB_SECRET_PATH);
    if (existing) return existing;
    const secret = randomBytes(32).toString("hex");
    await writeBlob(BLOB_SECRET_PATH, secret, "text/plain");
    return secret;
  }
  try {
    if (!existsSync(secretPath)) {
      writeFileAtomic(secretPath, randomBytes(32).toString("hex"));
    }
    return readFileSync(secretPath, "utf8").trim();
  } catch {
    // Read-only filesystem without Blob (e.g. Vercel with no store): fall back
    // to an ephemeral in-memory secret. Sessions won't survive a restart, but
    // requests keep working instead of 500ing.
    console.warn("[auth] Secret file not writable — using an ephemeral session secret.");
    return getEphemeralSecret();
  }
}

let ephemeralSecret: string | null = null;
// Lazily created so importing this module never throws.
function getEphemeralSecret(): string {
  if (!ephemeralSecret) ephemeralSecret = randomBytes(32).toString("hex");
  return ephemeralSecret;
}
