CREATE TABLE IF NOT EXISTS scores (
  game_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (game_id, player_name)
);

CREATE INDEX IF NOT EXISTS idx_scores_game_score ON scores (game_id, score DESC);
