-- Este script crea la vista 'matches_enriched'
-- Esta vista simplifica las consultas para obtener datos de partidos
-- junto con información de jugadores, torneos y categorías.

CREATE OR REPLACE VIEW matches_enriched AS
SELECT
    m.id,
    m.tournament_id,
    m.category_id,
    m.player1_id,
    m.player2_id,
    m.scheduled_date,
    m.venue,
    m.status,
    m.player1_confirmed,
    m.player2_confirmed,
    m.result_player1_sets,
    m.result_player2_sets,
    m.result_player1_games,
    m.result_player2_games,
    m.winner_id,
    m.notes AS match_notes,
    m.created_at AS match_created_at,
    m.updated_at AS match_updated_at,
    p1.name AS player1_name,
    p1.avatar_url AS player1_avatar_url, -- Asume que tienes avatar_url en tu tabla users
    p2.name AS player2_name,
    p2.avatar_url AS player2_avatar_url, -- Asume que tienes avatar_url en tu tabla users
    t.name AS tournament_name,
    c.name AS category_name
FROM
    matches m
    LEFT JOIN users p1 ON m.player1_id = p1.id
    LEFT JOIN users p2 ON m.player2_id = p2.id
    LEFT JOIN tournaments t ON m.tournament_id = t.id
    LEFT JOIN categories c ON m.category_id = c.id;

RAISE NOTICE 'Vista "matches_enriched" creada o actualizada exitosamente.';
