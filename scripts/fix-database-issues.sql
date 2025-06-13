-- Arreglar problemas de la base de datos

-- 1. Asegurar que la tabla tournaments tenga la columna category_id
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_tournaments_category_id ON tournaments(category_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(active);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_category ON matches(tournament_id, category_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_users_category ON users(category);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- 3. Limpiar datos inconsistentes
UPDATE matches SET player1_id = NULL WHERE player1_id NOT IN (SELECT id FROM users);
UPDATE matches SET player2_id = NULL WHERE player2_id NOT IN (SELECT id FROM users);
UPDATE matches SET winner_id = NULL WHERE winner_id NOT IN (SELECT id FROM users);

-- 4. Asegurar que todos los usuarios tengan una categoría válida
UPDATE users 
SET category = '1' 
WHERE category IS NULL OR category NOT IN (SELECT id::text FROM categories);

-- 5. Crear función para limpiar datos huérfanos
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS void AS $$
BEGIN
  -- Limpiar rankings huérfanos
  DELETE FROM rankings 
  WHERE user_id NOT IN (SELECT id FROM users)
     OR tournament_id NOT IN (SELECT id FROM tournaments)
     OR category_id NOT IN (SELECT id FROM categories);
     
  -- Limpiar survey_responses huérfanos
  DELETE FROM survey_responses 
  WHERE user_id NOT IN (SELECT id FROM users);
  
  -- Limpiar tournament_participants huérfanos (si existe)
  DELETE FROM tournament_participants 
  WHERE user_id NOT IN (SELECT id FROM users)
     OR tournament_id NOT IN (SELECT id FROM tournaments)
     OR category_id NOT IN (SELECT id FROM categories);
     
  RAISE NOTICE 'Cleanup completed successfully';
END;
$$ LANGUAGE plpgsql;

-- 6. Ejecutar limpieza
SELECT cleanup_orphaned_data();

-- 7. Crear vista para estadísticas de torneos
CREATE OR REPLACE VIEW tournament_stats AS
SELECT 
  t.id as tournament_id,
  t.name as tournament_name,
  t.category_id,
  c.name as category_name,
  COUNT(DISTINCT m.id) as total_matches,
  COUNT(DISTINCT CASE WHEN m.status = 'played' THEN m.id END) as played_matches,
  COUNT(DISTINCT m.player1_id) + COUNT(DISTINCT m.player2_id) as total_players
FROM tournaments t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN matches m ON t.id = m.tournament_id
GROUP BY t.id, t.name, t.category_id, c.name;

-- 8. Crear función para recalcular rankings automáticamente
CREATE OR REPLACE FUNCTION recalculate_rankings(p_tournament_id INTEGER, p_category_id INTEGER)
RETURNS void AS $$
BEGIN
  -- Esta función será llamada desde la aplicación
  -- Por ahora solo registramos que fue llamada
  INSERT INTO rankings (tournament_id, category_id, user_id, position, points, average, last_updated)
  SELECT p_tournament_id, p_category_id, id, 0, 0, 0, NOW()
  FROM users 
  WHERE category = p_category_id::text AND active = true
  ON CONFLICT (tournament_id, category_id, user_id) 
  DO UPDATE SET last_updated = NOW();
  
  RAISE NOTICE 'Rankings recalculation triggered for tournament % category %', p_tournament_id, p_category_id;
END;
$$ LANGUAGE plpgsql;
