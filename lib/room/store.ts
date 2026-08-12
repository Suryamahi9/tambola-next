import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { get as blobGet, put as blobPut } from "@vercel/blob";
import type { Room } from "./types";

interface Store {
  rooms: Room[];
}

const dataDir = path.join(process.cwd(), "data");
const roomsPath = path.join(dataDir, "rooms.json");
const BLOB_ROOMS_PATH = "tambola/rooms.json";

// Rooms mutate frequently (called numbers). Keep an in-memory cache and
// persist to the dual backend (Blob in prod, data/ locally). Writes per room
// are serialized so concurrent joins don't lose updates within one instance.
const cache = new Map<string, Room>();
const writeQueues = new Map<string, Promise<unknown>>();

function usingBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlob(): Promise<string | null> {
  const result = await blobGet(BLOB_ROOMS_PATH, { access: "private", useCache: false });
  if (!result) return null;
  return new Response(result.stream).text();
}

async function writeBlob(body: string): Promise<void> {
  await blobPut(BLOB_ROOMS_PATH, body, {
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

async function loadAllRooms(): Promise<Room[]> {
  if (usingBlobStore()) {
    const raw = await readBlob();
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as Store).rooms ?? [];
    } catch {
      return [];
    }
  }
  if (!existsSync(roomsPath)) return [];
  try {
    return (JSON.parse(readFileSync(roomsPath, "utf8")) as Store).rooms ?? [];
  } catch {
    return [];
  }
}

function persistAll(rooms: Room[]): Promise<void> {
  const raw = JSON.stringify({ rooms }, null, 2);
  if (usingBlobStore()) return writeBlob(raw);
  writeFileAtomic(roomsPath, raw);
  return Promise.resolve();
}

/** Serialize a room mutation: read latest (always fresh from the backend so
 *  concurrent lambdas don't clobber each other), apply, cache, persist. */
export function withRoom<T>(roomId: string, fn: (room: Room | null) => T): Promise<T> {
  const prev = writeQueues.get(roomId) ?? Promise.resolve();
  const next = prev.then(async () => {
    const room: Room | null =
      (await loadAllRooms()).find((r) => r.id === roomId) ?? null;
    if (room) cache.set(roomId, room);
    const result = fn(room);
    if (room) {
      await persistAll(Array.from(cache.values()));
    }
    return result;
  });
  writeQueues.set(roomId, next.catch(() => undefined));
  return next;
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  if (cache.has(roomId)) return cache.get(roomId)!;
  const rooms = await loadAllRooms();
  const room = rooms.find((r) => r.id === roomId) ?? null;
  if (room) cache.set(room.id, room);
  return room;
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const wanted = code.trim().toUpperCase();
  const rooms = await loadAllRooms();
  const room = rooms.find((r) => r.code === wanted) ?? null;
  if (room) cache.set(room.id, room);
  return room;
}

export async function insertRoom(room: Room): Promise<Room> {
  cache.set(room.id, room);
  await persistAll(Array.from(cache.values()));
  return room;
}
