import { NextResponse } from "next/server";
import { describeStoreError } from "@/lib/store-error";

/** Mirror an engine error with its status (409 only when it carries none). */
export function roomError(result: { error: string; status?: number }) {
  return NextResponse.json({ error: result.error }, { status: result.status ?? 409 });
}

/** A store/Blob failure is a JSON 500, never an unhandled rejection. */
export function roomFailure(err: unknown) {
  console.error("[rooms] request failed:", err);
  return NextResponse.json({ error: describeStoreError(err) }, { status: 500 });
}
