-- ============================================================
-- DartMate – H2H-vlag voor oefenpotjes
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Voeg de kolom toe (bestaande rijen krijgen automatisch TRUE)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS count_for_h2h BOOLEAN NOT NULL DEFAULT TRUE;

-- Verificatie
SELECT id, game_type, date, count_for_h2h
FROM games
ORDER BY date DESC
LIMIT 10;
