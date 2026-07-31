/// <reference types="@cloudflare/workers-types" />
/** 가족 공용 점수 저장 API — Cloudflare Pages Functions + D1
 * GET  /api/scores?game=<gameId>        상위 점수 목록
 * POST /api/scores {game,name,score}    점수 기록(최고 기록일 때만 갱신) */

interface Env {
  DB: D1Database;
}

const MAX_NAME_LEN = 20;
const MAX_GAME_LEN = 40;
const MAX_SCORE = 100_000_000;
const RESULT_LIMIT = 20;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const game = url.searchParams.get("game");
  if (!game || game.length > MAX_GAME_LEN) {
    return json({ error: "invalid game" }, 400);
  }

  const { results } = await env.DB.prepare(
    "SELECT player_name AS name, score FROM scores WHERE game_id = ? ORDER BY score DESC LIMIT ?"
  )
    .bind(game, RESULT_LIMIT)
    .all<{ name: string; score: number }>();

  return json({ scores: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { game?: unknown; name?: unknown; score?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const { game, name, score } = body;
  if (
    typeof game !== "string" ||
    !game ||
    game.length > MAX_GAME_LEN ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > MAX_SCORE
  ) {
    return json({ error: "invalid payload" }, 400);
  }

  const trimmedName = name.trim().slice(0, MAX_NAME_LEN);
  const now = Date.now();

  const existing = await env.DB.prepare("SELECT score FROM scores WHERE game_id = ? AND player_name = ?")
    .bind(game, trimmedName)
    .first<{ score: number }>();

  const isRecord = !existing || score > existing.score;
  if (isRecord) {
    await env.DB.prepare(
      `INSERT INTO scores (game_id, player_name, score, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (game_id, player_name) DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at`
    )
      .bind(game, trimmedName, score, now)
      .run();
  }

  return json({ recorded: isRecord, best: isRecord ? score : existing!.score });
};
