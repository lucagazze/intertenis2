-- Create tournament_participants table to track which users are registered in which tournaments
CREATE TABLE IF NOT EXISTS tournament_participants (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  UNIQUE(tournament_id, category_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_category_id ON tournament_participants(category_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_active ON tournament_participants(active);

-- Insert sample data - register all active users in tournament 1 for their respective categories
INSERT INTO tournament_participants (tournament_id, category_id, user_id)
SELECT 
  1 as tournament_id,
  CAST(u.category AS INTEGER) as category_id,
  u.id as user_id
FROM users u
WHERE u.active = true 
  AND u.category IS NOT NULL 
  AND u.category != ''
  AND NOT EXISTS (
    SELECT 1 FROM tournament_participants tp 
    WHERE tp.tournament_id = 1 
      AND tp.category_id = CAST(u.category AS INTEGER) 
      AND tp.user_id = u.id
  );

-- Verify the data
SELECT 
  tp.id,
  t.name as tournament_name,
  c.name as category_name,
  u.name as user_name,
  tp.registered_at
FROM tournament_participants tp
JOIN tournaments t ON tp.tournament_id = t.id
JOIN categories c ON tp.category_id = c.id
JOIN users u ON tp.user_id = u.id
WHERE tp.active = true
ORDER BY tp.tournament_id, tp.category_id, u.name;
