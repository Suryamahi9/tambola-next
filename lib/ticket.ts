export type Grid = (number | null)[][];
export type Ticket = Grid;

const BATCH_KEY = "tambola-batches-v3";

export interface Batch {
  time: string;
  tickets: Grid[];
}

// ---------------------------------------------------------------------------
// Single ticket: 3x9 grid with exactly 15 numbers, 5 per row, columns by tens
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function tryGenerateTicket(): Grid | null {
  const grid: Grid = Array.from({ length: 3 }, () => Array(9).fill(null));

  const colRanges = Array.from({ length: 9 }, (_, c) => ({
    start: c === 0 ? 1 : c * 10,
    end: c === 8 ? 90 : c * 10 + 9,
  }));

  // Column counts: 1-3 each, total 15
  const colCounts = Array(9).fill(1);
  let remaining = 6;
  while (remaining > 0) {
    const col = Math.floor(Math.random() * 9);
    if (colCounts[col] < 3) {
      colCounts[col]++;
      remaining--;
    }
  }

  // Assign rows (each row exactly 5), interleaving tie-breaks so rows
  // spread instead of stacking vertically.
  const rowCounts = [0, 0, 0];
  const colRows: number[][] = Array.from({ length: 9 }, () => []);
  const colOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(
    (a, b) => colCounts[b] - colCounts[a] || Math.random() - 0.5
  );

  for (const col of colOrder) {
    const count = colCounts[col];
    const avail = [0, 1, 2].filter((r) => rowCounts[r] < 5);
    shuffle(avail);
    avail.sort((a, b) => rowCounts[a] - rowCounts[b]);
    const chosen = avail.slice(0, count);
    for (const r of chosen) {
      colRows[col].push(r);
      rowCounts[r]++;
    }
  }

  if (rowCounts[0] !== 5 || rowCounts[1] !== 5 || rowCounts[2] !== 5) {
    return null;
  }

  // Fill numbers, ascending within each column (top-to-bottom)
  for (let col = 0; col < 9; col++) {
    const { start, end } = colRanges[col];
    const pool: number[] = [];
    for (let n = start; n <= end; n++) pool.push(n);
    shuffle(pool);
    const nums = pool.slice(0, colCounts[col]).sort((a, b) => a - b);
    const rows = colRows[col].slice().sort((a, b) => a - b);
    for (let i = 0; i < rows.length; i++) {
      grid[rows[i]][col] = nums[i];
    }
  }

  return grid;
}

export function generateTicket(): Grid {
  for (let attempt = 0; attempt < 300; attempt++) {
    const grid = tryGenerateTicket();
    if (grid && isValidTicket(grid)) return grid;
  }
  return tryGenerateTicket()!;
}

// ---------------------------------------------------------------------------
// Full official rules validator
// ---------------------------------------------------------------------------

export function isValidTicket(grid: Grid, maxRun = 3): boolean {
  let total = 0;
  const colCounts = Array(9).fill(0);

  for (let r = 0; r < 3; r++) {
    let rowCount = 0;
    let prev = 0;
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v !== null) {
        total++;
        rowCount++;
        colCounts[c]++;
        if (v <= prev) return false; // rows ascending L->R, no repeats
        prev = v;
      }
    }
    if (rowCount !== 5) return false;
  }

  if (total !== 15) return false;

  for (let c = 0; c < 9; c++) {
    if (colCounts[c] < 1 || colCounts[c] > 3) return false;
    let prev = 0;
    for (let r = 0; r < 3; r++) {
      const v = grid[r][c];
      if (v !== null) {
        if (v <= prev) return false; // columns ascending top-to-bottom
        prev = v;
      }
    }
  }

  // Aesthetic: no long consecutive filled cells in a row
  for (let r = 0; r < 3; r++) {
    let run = 0;
    for (let c = 0; c < 9; c++) {
      run = grid[r][c] === null ? 0 : run + 1;
      if (run >= maxRun) return false;
    }
  }

  return true;
}

export function gridKey(grid: Grid): string {
  return grid.map((row) => row.map((v) => (v === null ? "" : v)).join("|")).join("/");
}

export function generateUniqueGrids(count: number): Grid[] {
  const seen = new Set<string>();
  const grids: Grid[] = [];
  const maxAttempts = Math.max(800, count * 120);
  let attempts = 0;

  while (grids.length < count && attempts < maxAttempts) {
    attempts++;
    const grid = generateTicket();
    const key = gridKey(grid);
    if (seen.has(key)) continue;
    seen.add(key);
    grids.push(grid);
  }

  let guard = 0;
  while (grids.length < count && guard < 500) {
    guard++;
    const grid = generateTicket();
    const key = gridKey(grid);
    if (seen.has(key)) continue;
    seen.add(key);
    grids.push(grid);
  }

  return grids;
}

// ---------------------------------------------------------------------------
// Party-room sets: a unique full 90-number book (strip of 6) sliced to size.
// Every number from 1-90 appears exactly once across the strip, so a player's
// tickets never repeat a number and every player's set is unique.
// ---------------------------------------------------------------------------

export function generateSetTickets(ticketCount: number): Grid[] {
  const count = Math.max(1, Math.min(5, Math.floor(ticketCount)));
  for (let attempt = 0; attempt < 25; attempt++) {
    const strip = generateStrip();
    if (!strip) continue;
    // Shuffle which strip tickets are dealt so a purchase never always gets
    // the "first" ticket of the book.
    const order = shuffle([0, 1, 2, 3, 4, 5]);
    return order.slice(0, count).map((i) => strip[i]);
  }
  // Should be unreachable in practice; fall back to plain unique grids.
  return generateUniqueGrids(count);
}

// ---------------------------------------------------------------------------
// Full-set batch for the ticket generator: `setCount` 6-ticket books covering
// 1-90 exactly once each, with NO duplicate ticket across the whole batch.
// Returns null if unique sets could not be found after retries.
// ---------------------------------------------------------------------------

export function generateSetBatch(setCount: number): Grid[] | null {
  const count = Math.max(1, Math.min(10, Math.floor(setCount)));
  const seen = new Set<string>();
  const grids: Grid[] = [];
  for (let s = 0; s < count; s++) {
    let strip: Grid[] | null = null;
    for (let attempt = 0; attempt < 25 && !strip; attempt++) {
      const candidate = generateStrip();
      if (candidate && candidate.every((g) => !seen.has(gridKey(g)))) {
        strip = candidate;
      }
    }
    if (!strip) return null;
    strip.forEach((g) => {
      seen.add(gridKey(g));
      grids.push(g);
    });
  }
  return grids;
}

// ---------------------------------------------------------------------------
// Full-set 6-ticket book (all 90 numbers exactly once)
// ---------------------------------------------------------------------------

const STRIP_TWOS_PER_COL = [3, 4, 4, 4, 4, 4, 4, 4, 5];

function buildStripCounts(): number[][] | null {
  for (let attempt = 0; attempt < 20000; attempt++) {
    const cc = Array.from({ length: 6 }, () => Array(9).fill(0));
    const twos = Array(6).fill(0);
    const ones = Array(6).fill(0);
    let ok = true;

    for (let c = 0; c < 9 && ok; c++) {
      const k = STRIP_TWOS_PER_COL[c];
      const candidates = shuffle([0, 1, 2, 3, 4, 5].filter((t) => twos[t] < 6));
      const chosen: number[] = [];
      for (const t of candidates) {
        if (chosen.length >= k) break;
        const remainingCols = 9 - c - 1;
        const needTwos = 6 - (twos[t] + 1);
        const needOnes = 3 - ones[t];
        if (needTwos + needOnes <= remainingCols) chosen.push(t);
      }
      if (chosen.length !== k) {
        ok = false;
        break;
      }
      for (let t = 0; t < 6; t++) {
        cc[t][c] = chosen.includes(t) ? 2 : 1;
        if (chosen.includes(t)) twos[t]++;
        else ones[t]++;
      }
      for (let t = 0; t < 6; t++) {
        if (twos[t] + (9 - c - 1) < 6) {
          ok = false;
          break;
        }
      }
    }

    if (!ok) continue;
    if (twos.every((x) => x === 6) && ones.every((x) => x === 3)) return cc;
  }
  return null;
}

export function generateStrip(): Grid[] | null {
  for (let attempt = 0; attempt < 2000; attempt++) {
    const cc = buildStripCounts();
    if (!cc) continue;

    const tickets: Grid[] = Array.from({ length: 6 }, () =>
      Array.from({ length: 3 }, () => Array(9).fill(null))
    );
    const colNums: number[][][] = Array.from({ length: 6 }, () => Array(9));
    let ok = true;

    for (let c = 0; c < 9 && ok; c++) {
      const start = c === 0 ? 1 : c * 10;
      const end = c === 8 ? 90 : c * 10 + 9;
      const pool: number[] = [];
      for (let n = start; n <= end; n++) pool.push(n);
      shuffle(pool);
      let idx = 0;
      for (let t = 0; t < 6; t++) {
        const cnt = cc[t][c];
        colNums[t][c] = pool.slice(idx, idx + cnt).sort((a, b) => a - b);
        idx += cnt;
      }
    }

    for (let t = 0; t < 6 && ok; t++) {
      const colCounts = cc[t];
      const rowCounts = [0, 0, 0];
      const colRows: number[][] = Array.from({ length: 9 }, () => []);
      const colOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(
        (a, b) => colCounts[b] - colCounts[a] || Math.random() - 0.5
      );

      for (const col of colOrder) {
        const count = colCounts[col];
        const avail = [0, 1, 2].filter((r) => rowCounts[r] < 5);
        shuffle(avail);
        avail.sort((a, b) => rowCounts[a] - rowCounts[b]);
        const chosen = avail.slice(0, count);
        for (const r of chosen) {
          colRows[col].push(r);
          rowCounts[r]++;
        }
      }

      if (rowCounts[0] !== 5 || rowCounts[1] !== 5 || rowCounts[2] !== 5) {
        ok = false;
        break;
      }

      for (let col = 0; col < 9; col++) {
        const rows = colRows[col].slice().sort((a, b) => a - b);
        for (let i = 0; i < rows.length; i++) {
          tickets[t][rows[i]][col] = colNums[t][col][i];
        }
      }

      if (!isValidTicket(tickets[t], 4)) {
        ok = false;
        break;
      }
    }

    if (!ok) continue;

    const seen = new Set<number>();
    let covered = true;
    for (let t = 0; t < 6 && covered; t++) {
      for (let r = 0; r < 3 && covered; r++) {
        for (let c = 0; c < 9; c++) {
          const v = tickets[t][r][c];
          if (v === null) continue;
          if (seen.has(v)) {
            covered = false;
            break;
          }
          seen.add(v);
        }
      }
    }
    if (covered && seen.size === 90) return tickets;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Batch persistence (localStorage, guarded for SSR)
// ---------------------------------------------------------------------------

export function loadBatches(): Batch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BATCH_KEY);
    return raw ? (JSON.parse(raw) as Batch[]) : [];
  } catch {
    return [];
  }
}

export function saveBatch(tickets: Grid[]): Batch[] {
  const batches = loadBatches();
  const next: Batch[] = [
    { time: new Date().toLocaleString(), tickets },
    ...batches,
  ].slice(0, 5);
  try {
    localStorage.setItem(BATCH_KEY, JSON.stringify(next));
  } catch {
    /* storage full / private mode */
  }
  return next;
}
