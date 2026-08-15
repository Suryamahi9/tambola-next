<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tambola Next

Online Tambola/Housie app: landing page, live caller (`/game`), ticket generator (`/tickets`), rules (`/rules`). Landing and rules are public; `/game`, `/tickets`, `/login`, `/admin` are dynamic (member-gated). Origin: `https://github.com/Suryamahi9/tambola-next.git` (branch `main`).

## Commands

- `npm run lint` — eslint; must be clean (errors block work).
- `npm run build` — `next build` (Turbopack); this is also the typecheck.
- `npm run dev` / `npm run start` — dev / prod server.
- No test runner is configured. Verify changes by lint + build + the headless harness (see below).

## Stack

- Next 16.3.0 (breaking changes — see block above), React 19, TypeScript, Tailwind v4 (`@import "tailwindcss"` + `@theme inline` in `app/globals.css`).
- `lib/ticket.ts` — pure ticket engine, no deps: `generateTicket`, `generateUniqueGrids`, `generateStrip`, `generateSetTickets`, `isValidTicket`, `gridKey`, `loadBatches`/`saveBatch` (localStorage). `lib/site.ts` — site config/metadata.

## Design constraints (dark-only glassmorphism)

- `<html>` carries a permanent `dark` class; body is `bg-neutral-950`. No ThemeToggle and no light mode — do not add theme switching.
- Panels use `.glass` / `.glass-subtle` in `globals.css` (translucent gradient + inset highlight). Do NOT reintroduce `backdrop-blur` or the old solid `bg-white ... dark:bg-neutral-900` cards; on dark surfaces use `border-white/10` + `bg-white/[0.03–0.06]`.
- `TicketCard.tsx` alternates white/brown shells by index parity (`SHELLS[0]` cream, `SHELLS[1]` brown) and takes an optional `called?: ReadonlySet<number>` to highlight drawn numbers (emerald cell). `TambolaScene.tsx` draws the same alternating shells on its canvas textures — keep both in sync. The party-room view and win popup render tickets through `TicketCard` so they keep the same shells + called marks.

## 3D scene gotchas (hard-won)

- Scene = `components/landing/TambolaScene.tsx` (R3F Canvas) + `TambolaSceneLoader.tsx` (Client Component wrapper using `next/dynamic` with `ssr: false`). In Next 16, `ssr: false` is only allowed inside a Client Component, hence the loader.
- Only `three` + `@react-three/fiber` are installed. **`@react-three/drei` is deliberately absent** — it caused a dev-only Turbopack `_instanceof` ReferenceError that killed the 3D render. Do not reinstall it.
- Camera framing (`layoutParams`: fov/backZ/xSpread) is responsive to viewport aspect so the ticket album fits portrait phones.
- The scene mutates the camera inside `useFrame`. ESLint's `react-hooks/immutability` rule flags this (false positive) — needs an eslint-disable on both the `useFrame` call line and the `camera.fov` assignment line.

## Member auth (self-hosted or Vercel)

- Custom cookie-session auth — no Auth.js/NextAuth or external service. Stack: `lib/auth/password.ts` (Node `crypto.scryptSync` + `timingSafeEqual`), `lib/auth/session.ts` (HMAC-SHA256 signed `uid.role.exp` token, cookie `tambola_session`, httpOnly/lax, 7-day), `lib/auth/store.ts`, `lib/auth/auth.ts` (DAL: `getCurrentUser`/`requireMember`/`requireAdmin`).
- **Storage is dual-backend.** With `BLOB_READ_WRITE_TOKEN` set, members + the session secret live in Vercel Blob (`@vercel/blob` SDK, private store, pathnames `tambola/members.json` + `tambola/secret.txt`, `useCache:false`, `allowOverwrite:true`). Without it, they fall back to the gitignored local `data/` directory (dev). Do NOT write to the filesystem in prod — Vercel's FS is read-only; that's what broke login when deployed before Blob.
- All store/session functions are async (Blob is a network call). Gating: server pages call `await requireMember("/game")` (redirects to `/login?next=…`). `app/game/page.tsx`, `app/tickets/page.tsx`, `app/admin/page.tsx` and `app/api/me/route.ts` all `export const dynamic = "force-dynamic"` (they read cookies). Server actions live in `app/actions/{auth,admin}.ts` ("use server").
- `/login` uses a `useActionState` form; the Navbar `AuthNav.tsx` client component polls `GET /api/me` to show Sign in / name+Sign out / Admin link. `app/admin/page.tsx` is the member manager (add/remove/reset password) — `requireAdmin` bounces non-admins to `/`.
- First-run bootstrap creates the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (fallback: `admin@tambola.local` + a random password printed to stdout) and only when no members blob/file exists. `.env.local` is gitignored — on Vercel, ADMIN_EMAIL/ADMIN_PASSWORD/AUTH_SECRET/COOKIE_SECURE must be set as **project env vars**. `AUTH_SECRET` pins the signing key; `COOKIE_SECURE=true` is required behind HTTPS.
- Copy `.env.example` → `.env.local`. Members are invited via the admin panel, not self-registration.

## Party Rooms (multiplayer)

- Flow: `/play` (name + ticket count + optional room-code join) → Razorpay checkout (or test-mode auto-approve) → `/room/[id]` lobby → the **host (first player) starts** once **15 paid tickets** are in. Rooms hold **15–50 tickets**; one player may buy **1–5 tickets** (`MAX_TICKETS_PER_PLAYER`). The room **auto-starts only when it fills to 50** (`MAX_ROOM_TICKETS`) — otherwise it waits for the host. Host start is `POST /api/rooms/[id]/start`.
- **No WebSockets.** Next 16 has no socket support and Vercel serverless can't hold connections. Rooms sync by **2s polling** from `components/room/RoomView.tsx` (`GET /api/rooms/[id]`, `Cache-Control: no-store`); the caller auto-draws every 5s. Do NOT scaffold a socket server.
- Room code lives in `lib/room/`: `types.ts` (`Room`, `Player`, `PublicRoom`, `Win`), `store.ts` (dual-backend `data/rooms.json` + Blob `tambola/rooms.json`, in-memory cache, per-room write queue via `withRoom()`), `engine.ts` (create/join/start/host-gated start/call/takeover, `TICKETS_TO_START=15` minimum, `MAX_ROOM_TICKETS=50` cap, price via `ROOM_TICKET_PRICE` default ₹20), `wins.ts` (pure win detection).
- **Win detection:** after every draw, `findWinner` (in `lib/room/wins.ts`) checks paid players' tickets against the called numbers. Pattern priority: Full House → Corners → Bottom/Middle/Top Line → Early Five. The first complete pattern sets `room.winner` and ends the game; everyone sees a win popup (winning ticket + all players + winner name) in `RoomView`. A room with no winner ends naturally at 90 numbers.
- **`withRoom` always reloads the room fresh from the backend** before mutating (not from the in-memory cache) so concurrent serverless instances don't clobber each other; reads via `getRoomById` may use the cache.
- Player identity = HMAC-signed `tambola_player` cookie (reuses `lib/auth/session.ts` `signToken`/`verifyToken` with role `player`), set by `POST /api/payments/create`. No signup. Each paid entry gets **fresh tickets from a unique full 90-number set** (`generateSetTickets` — a strip of 6 covering 1–90 exactly once, sliced to the bought count, so a player's numbers never repeat within their set) — if two devices appear to share a ticket, they're the same cookie/player in the same browser.
- Payments: Razorpay orders via `POST /api/payments/create` + signature-verified `POST /api/payments/verify` (`lib`-side HMAC-SHA256 on `order_id|payment_id`). **Without `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` the flow runs in test mode** and verify auto-approves — keep that working when exercising the room locally.
- The server draws numbers (`callNumber` picks at random from uncalled) so the board can't be tampered with; only `room.callerId` can call. `POST /api/rooms/[id]/caller` lets another player take over.
- `GET /api/rooms/[id]` returns `{ room, me, myTickets }` — a player only ever sees their own grids. All room route handlers use `params: Promise` (must `await`) and `export const dynamic = "force-dynamic"`.
- Next 16 gotcha: **do not set cookies via `NextResponse.cookies.set` in route handlers — the `Set-Cookie` header is silently dropped.** Use `(await cookies()).set(...)` from `next/headers` instead.

## Headless verification

- Harness lives in `C:\Users\Mahen\AppData\Local\Temp\opencode` (puppeteer-core + Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).
- To read the WebGL canvas: grab the `webgl2`/`webgl` context and `readPixels` (launch args need `--enable-unsafe-swiftshader`). Set `canvas.style.display = "none"` and wait ~200 ms so the last rendered frame stays in the buffer; take a screenshot first to force a composite flush. Toggling display between samples can zero the buffer — use a fresh page load per scroll sample.
- git commit messages are short imperative summaries. LF→CRLF warnings on commit are harmless (`core.autocrlf`).
