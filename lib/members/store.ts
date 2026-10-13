import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { get as blobGet, put as blobPut } from "@vercel/blob";
import { hashPassword } from "./password";
import { MIN_PASSWORD_LENGTH, type Member, type MemberPublic, type MemberRole } from "./types";

/**
 * Member store — dual backend like the room store: a private Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set, otherwise the gitignored local data/ directory.
 *
 * Kept deliberately simple: no in-memory cache (admin reads/writes are rare),
 * no per-member session version (a password reset does NOT sign the member's
 * existing tabs out — that was an intentional simplification). Writes are
 * serialized so two admins can't interleave a load-modify-write.
 */

const dataDir = path.join(process.cwd(), "data");
const membersPath = path.join(dataDir, "members.json");
const BLOB_MEMBERS_PATH = "tambola/members.json";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function usingBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlob(): Promise<string | null> {
  const result = await blobGet(BLOB_MEMBERS_PATH, { access: "private", useCache: false });
  if (!result) return null;
  return new Response(result.stream).text();
}

async function writeBlob(body: string): Promise<void> {
  await blobPut(BLOB_MEMBERS_PATH, body, {
    access: "private",
    contentType: "application/json",
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

async function loadMembers(): Promise<Member[]> {
  let raw: string | null = null;
  if (usingBlobStore()) {
    raw = await readBlob();
  } else if (existsSync(membersPath)) {
    raw = readFileSync(membersPath, "utf8");
  }
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as { members?: Member[] }).members ?? [];
  } catch {
    throw new Error(
      "The member store is corrupted. Delete data/members.json (or the tambola/members.json blob) and set up the first admin again."
    );
  }
}

async function saveMembers(members: Member[]): Promise<void> {
  const raw = JSON.stringify({ members }, null, 2);
  if (usingBlobStore()) await writeBlob(raw);
  else writeFileAtomic(membersPath, raw);
}

let writeQueue: Promise<unknown> = Promise.resolve();
function withStoreWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn);
  writeQueue = next.catch(() => undefined);
  return next;
}

function toPublic(m: Member): MemberPublic {
  return { id: m.id, name: m.name, email: m.email, role: m.role, createdAt: m.createdAt };
}

function newId(): string {
  return randomBytes(8).toString("hex");
}

function normalizeRole(role: unknown): MemberRole {
  return role === "admin" ? "admin" : "member";
}

function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Shared validation for creating a member. Returns an error string or null. */
function validateNew(email: string, password: string): string | null {
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export type MemberResult = MemberPublic | { error: string };

export function isMemberError(result: MemberResult): result is { error: string } {
  return "error" in result;
}

export async function listMembers(): Promise<MemberPublic[]> {
  const members = await loadMembers();
  return members
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toPublic);
}

export async function countMembers(): Promise<number> {
  return (await loadMembers()).length;
}

export async function getMemberById(id: string): Promise<Member | null> {
  return (await loadMembers()).find((m) => m.id === id) ?? null;
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const wanted = cleanEmail(email);
  return (await loadMembers()).find((m) => m.email === wanted) ?? null;
}

/** Create the very first admin. Refuses once any member exists, so an empty
 *  store can't be claimed twice. */
export async function createFirstAdmin(input: {
  name?: string;
  email: string;
  password: string;
}): Promise<MemberResult> {
  const email = cleanEmail(input.email);
  const invalid = validateNew(email, input.password);
  if (invalid) return { error: invalid };

  return withStoreWrite(async () => {
    const members = await loadMembers();
    if (members.length > 0) return { error: "Setup is already complete — sign in instead." };

    const { hash, salt } = hashPassword(input.password);
    const admin: Member = {
      id: newId(),
      name: input.name?.trim() || email.split("@")[0],
      email,
      passwordHash: hash,
      salt,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    await saveMembers([admin]);
    return toPublic(admin);
  });
}

export async function addMember(input: {
  name?: string;
  email: string;
  password: string;
  role?: string;
}): Promise<MemberResult> {
  const email = cleanEmail(input.email);
  const invalid = validateNew(email, input.password);
  if (invalid) return { error: invalid };

  return withStoreWrite(async () => {
    const members = await loadMembers();
    if (members.some((m) => m.email === email)) {
      return { error: `A member already exists with ${email}.` };
    }
    const { hash, salt } = hashPassword(input.password);
    const member: Member = {
      id: newId(),
      name: input.name?.trim() || email.split("@")[0],
      email,
      passwordHash: hash,
      salt,
      role: normalizeRole(input.role),
      createdAt: new Date().toISOString(),
    };
    members.push(member);
    await saveMembers(members);
    return toPublic(member);
  });
}

export async function deleteMember(id: string): Promise<{ error?: string }> {
  return withStoreWrite(async () => {
    const members = await loadMembers();
    const target = members.find((m) => m.id === id);
    if (!target) return { error: "Member not found." };
    if (target.role === "admin" && members.filter((m) => m.role === "admin").length <= 1) {
      return { error: "You can't remove the last admin." };
    }
    await saveMembers(members.filter((m) => m.id !== id));
    return {};
  });
}

/** Set a new password. NOTE: without a session version this does not invalidate
 *  the member's already-issued tokens — they stay valid until they expire. */
export async function setMemberPassword(id: string, password: string): Promise<{ error?: string }> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  return withStoreWrite(async () => {
    const members = await loadMembers();
    const member = members.find((m) => m.id === id);
    if (!member) return { error: "Member not found." };
    const { hash, salt } = hashPassword(password);
    member.passwordHash = hash;
    member.salt = salt;
    await saveMembers(members);
    return {};
  });
}

export async function setMemberRole(id: string, role: string): Promise<{ error?: string }> {
  const next = normalizeRole(role);
  return withStoreWrite(async () => {
    const members = await loadMembers();
    const member = members.find((m) => m.id === id);
    if (!member) return { error: "Member not found." };
    if (member.role === next) return {};
    if (
      member.role === "admin" &&
      next === "member" &&
      members.filter((m) => m.role === "admin").length <= 1
    ) {
      return { error: "You can't demote the last admin." };
    }
    member.role = next;
    await saveMembers(members);
    return {};
  });
}
