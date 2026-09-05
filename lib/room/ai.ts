import type { Room } from "./types";

/** Chat lines that hand off to the AI announcer: @bot mentions + slash commands. */
export function isBotTrigger(text: string): boolean {
  return (
    /^@bot\b/i.test(text) ||
    /^\/(help|rules|patterns|prizes|status)\b/i.test(text)
  );
}

const SYSTEM_PROMPT = `You are Tambola Bot, a friendly assistant inside a live Tambola (Housie) game room in India. Players are adults playing for fun and small money prizes.
Reply in 1-2 short sentences, in the same language the player wrote in.
Tambola facts: each ticket is a 3x9 grid with exactly 15 numbers (1-90, 5 per row). Patterns, in priority order: Full House (all 15 numbers), Corners (the 4 corner numbers), Bottom Line, Middle Line, Top Line, Early Five (your first 5 numbers called). The caller is a player who draws the numbers; rooms run on small prizes per pattern and a Full House ends the game.`;

function gameContext(room: Room): string {
  const paid = room.players.filter((p) => p.paid).length;
  const prizes = room.prizes
    .map((p) => `${p.label} -> ${p.playerName}`)
    .join(", ");
  return [
    `Room code ${room.code}, round ${room.round}, status ${room.status}.`,
    `${room.calledNumbers.length}/90 numbers called; last number was ${room.lastNumber ?? "none"}.`,
    `${paid} paid player(s) in the room.`,
    prizes ? `Prizes so far: ${prizes}.` : "No prizes awarded yet.",
  ].join(" ");
}

function usingLiveAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.AI_BASE_URL);
}

/** Generate a bot reply. Uses a live LLM (OpenAI-compatible) when configured,
 *  otherwise falls back to canned answers so chat works end-to-end locally. */
export async function generateBotReply(text: string, room: Room): Promise<string> {
  if (!usingLiveAI()) return cannedReply(text);

  const endpoint = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 120,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: `Current game: ${gameContext(room)}` },
          { role: "user", content: text },
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`AI provider ${res.status}`);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (reply && reply.length <= 500) return reply;
    return cannedReply(text);
  } catch {
    return cannedReply(text);
  } finally {
    clearTimeout(timer);
  }
}

function cannedReply(text: string): string {
  const t = text.trim().toLowerCase();
  if (t.startsWith("/help") || t === "help") {
    return "Commands: /rules (how to play), /patterns (winning patterns), /prizes (prize flow), /status (game state). Tag @bot + a question to chat with me.";
  }
  if (t.startsWith("/rules") || t.includes("how to play")) {
    return "How to play: each ticket is a 3x9 grid with 15 numbers (5 per row, 1-90). Mark numbers as the caller draws them. Complete a pattern to win its prize — Full House ends the game.";
  }
  if (t.startsWith("/patterns") || t.includes("pattern") || t.includes("corners") || t.includes("early five")) {
    return "Patterns, in priority: Full House (all 15), Corners (the 4 corners), Bottom -> Middle -> Top Line, and Early Five (your first 5 numbers called). One prize per pattern, first paid player to complete it wins.";
  }
  if (t.startsWith("/prizes") || t.includes("prize")) {
    return "Each pattern pays out once to the first paid player who completes it: Full House, Corners, the three lines, and Early Five. Keep watching the board and press Bingo! when your ticket completes something.";
  }
  if (t.startsWith("/status") || t.includes("status")) {
    return "The room panel shows the live board, called numbers, your marked tickets, and prizes won in real time. Ask the room host for the exact score.";
  }
  if (t.startsWith("hi") || t.startsWith("hello") || t.startsWith("hey")) {
    return "Hi! 👋 I'm Tambola Bot. Try /rules for how to play, /patterns for winning patterns, or @bot + a question to chat.";
  }
  return "That's outside my canned replies — try /help, /rules, /patterns, /prizes, /status, or tag @bot with a question.";
}
