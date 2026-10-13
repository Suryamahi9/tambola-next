import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { get as blobGet, put as blobPut } from "@vercel/blob";

const dataDir = path.join(process.cwd(), "data");
const secretPath = path.join(dataDir, "secret");

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

/**
 * The HMAC secret behind signed tokens — currently the player persona cookie
 * that gates /play, /room/[id] and /history. Prefers AUTH_SECRET; otherwise a
 * secret is generated once and persisted (Blob in production, data/ locally).
 * Callers treat an unreachable secret as "no valid token" rather than crashing.
 */
export async function getSessionSecret(): Promise<string> {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  try {
    if (usingBlobStore()) {
      const existing = await readBlob(BLOB_SECRET_PATH);
      if (existing) return existing;
      const secret = randomBytes(32).toString("hex");
      await writeBlob(BLOB_SECRET_PATH, secret, "text/plain");
      return secret;
    }
    if (!existsSync(secretPath)) {
      writeFileAtomic(secretPath, randomBytes(32).toString("hex"));
    }
    return readFileSync(secretPath, "utf8").trim();
  } catch {
    // Blob unreachable (suspended store, no network) or a read-only FS with no
    // store: fall back to an ephemeral in-memory secret. Tokens won't survive a
    // restart or hop between serverless instances, but requests keep working
    // instead of 500ing. Set AUTH_SECRET to make the secret stable.
    console.warn("[auth] Session secret store unavailable — using an ephemeral session secret.");
    return getEphemeralSecret();
  }
}

let ephemeralSecret: string | null = null;
// Lazily created so importing this module never throws.
function getEphemeralSecret(): string {
  if (!ephemeralSecret) ephemeralSecret = randomBytes(32).toString("hex");
  return ephemeralSecret;
}
