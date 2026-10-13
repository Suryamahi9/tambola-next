/**
 * Turn a session/room store failure into something truthful and actionable.
 *
 * Vercel Blob reports the real reason (a suspended store, a bad or expired
 * token, a 403, a transient network blip). Flattening all of those into a
 * single "connect a Blob store" message sends people to the wrong fix — a
 * store that is connected but suspended is not a missing store. Classify what
 * we can and say what actually happened.
 */
export function describeStoreError(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  const message = err instanceof Error ? err.message : String(err ?? "");
  const hay = `${name} ${message}`;

  // Order matters: a suspended store's read failure also says
  // "Failed to fetch blob: 403 Forbidden", so check suspension first.
  if (/suspend/i.test(hay)) {
    return "This project's Blob store has been suspended, so the session secret and party rooms can't be read or written. Restore it (or create a new Blob store and connect it) in Vercel → Storage, then update BLOB_READ_WRITE_TOKEN.";
  }
  if (/BlobStoreNotFound|store .*not found/i.test(hay)) {
    return "The Blob store for this project no longer exists. Create a new Blob store in Vercel → Storage, connect it, and update BLOB_READ_WRITE_TOKEN.";
  }
  if (/403|forbidden|access denied|BlobAccessError/i.test(hay)) {
    return "The Blob store refused the request (403 Forbidden). That usually means the store is suspended or the token can't reach it — check it in Vercel → Storage.";
  }
  if (/401|unauthor|invalid .*token|token .*expired|BlobClientTokenExpired|BLOB_READ_WRITE_TOKEN/i.test(hay)) {
    return "BLOB_READ_WRITE_TOKEN is missing, expired, or invalid. Reconnect the Blob store (Vercel → Storage) and update the token, then try again.";
  }
  if (/rate.?limit|429|too many requests/i.test(hay)) {
    return "The Blob store is rate-limited right now — wait a moment and try again.";
  }
  if (/EROFS|EACCES|EPERM|read.?only/i.test(hay)) {
    return "The server's filesystem is read-only, so the session store can't be written. On Vercel, connect a Blob store (Dashboard → Storage → Create Blob → Connect) so BLOB_READ_WRITE_TOKEN is available.";
  }
  if (/ECONN|ENOTFOUND|ETIMEDOUT|network|fetch failed|socket hang|ServiceNotAvailable|ServiceUnavailable/i.test(hay)) {
    return "Couldn't reach the Blob store just now (network) — try again in a moment.";
  }
  return "The session and room store is unavailable right now. On Vercel, check that a Blob store is connected (Dashboard → Storage) and BLOB_READ_WRITE_TOKEN is set, then try again.";
}
