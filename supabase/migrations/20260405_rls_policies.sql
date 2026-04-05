-- ============================================================
-- DartMate – Row Level Security (RLS)
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. PLAYER_PROFILES
-- ──────────────────────────────────────────────────────────

-- RLS inschakelen (doet niets als al aan staat)
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Verwijder eventuele bestaande policies om conflicten te voorkomen
DROP POLICY IF EXISTS "Eigenaar kan eigen profielen zien"      ON player_profiles;
DROP POLICY IF EXISTS "Eigenaar kan eigen profielen aanmaken"  ON player_profiles;
DROP POLICY IF EXISTS "Eigenaar kan eigen profielen bijwerken" ON player_profiles;
DROP POLICY IF EXISTS "Eigenaar kan eigen profielen verwijderen" ON player_profiles;

-- SELECT: alleen eigen rijen
CREATE POLICY "Eigenaar kan eigen profielen zien"
  ON player_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: alleen met eigen user_id
CREATE POLICY "Eigenaar kan eigen profielen aanmaken"
  ON player_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: alleen eigen rijen
CREATE POLICY "Eigenaar kan eigen profielen bijwerken"
  ON player_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: alleen eigen rijen
CREATE POLICY "Eigenaar kan eigen profielen verwijderen"
  ON player_profiles FOR DELETE
  USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
-- 2. GAMES
-- ──────────────────────────────────────────────────────────

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigenaar kan eigen games zien"        ON games;
DROP POLICY IF EXISTS "Eigenaar kan eigen games aanmaken"    ON games;
DROP POLICY IF EXISTS "Eigenaar kan eigen games bijwerken"   ON games;
DROP POLICY IF EXISTS "Eigenaar kan eigen games verwijderen" ON games;

CREATE POLICY "Eigenaar kan eigen games zien"
  ON games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Eigenaar kan eigen games aanmaken"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigenaar kan eigen games bijwerken"
  ON games FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigenaar kan eigen games verwijderen"
  ON games FOR DELETE
  USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
-- 3. PAUSED_GAMES
-- ──────────────────────────────────────────────────────────

ALTER TABLE paused_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigenaar kan eigen gepauzeerde games zien"        ON paused_games;
DROP POLICY IF EXISTS "Eigenaar kan eigen gepauzeerde games aanmaken"    ON paused_games;
DROP POLICY IF EXISTS "Eigenaar kan eigen gepauzeerde games bijwerken"   ON paused_games;
DROP POLICY IF EXISTS "Eigenaar kan eigen gepauzeerde games verwijderen" ON paused_games;

CREATE POLICY "Eigenaar kan eigen gepauzeerde games zien"
  ON paused_games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Eigenaar kan eigen gepauzeerde games aanmaken"
  ON paused_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigenaar kan eigen gepauzeerde games bijwerken"
  ON paused_games FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigenaar kan eigen gepauzeerde games verwijderen"
  ON paused_games FOR DELETE
  USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
-- Verificatie: controleer welke policies actief zijn
-- ──────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('player_profiles', 'games', 'paused_games')
ORDER BY tablename, cmd;
