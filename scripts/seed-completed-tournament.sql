-- Asegúrate de que existan categorías y usuarios antes de ejecutar.
-- Puedes obtener IDs de usuarios existentes de tu tabla 'users'.
-- Asumamos que existe una categoría con id = 1 (ej. 'Primera Categoría')

DO $$
DECLARE
    new_tournament_id INT;
    cat_id INT := 1; -- ID de la categoría para el torneo (ajusta si es necesario)
    -- IDs de usuarios existentes (reemplaza con IDs reales de tu DB)
    -- Ejemplo de UUIDs. ¡DEBES REEMPLAZARLOS CON UUIDs VÁLIDOS DE TU TABLA users!
    user_a_id UUID := (SELECT id FROM users ORDER BY RANDOM() LIMIT 1); -- Jugador aleatorio 1
    user_b_id UUID := (SELECT id FROM users WHERE id <> user_a_id ORDER BY RANDOM() LIMIT 1); -- Jugador aleatorio 2, diferente de 1
    user_c_id UUID := (SELECT id FROM users WHERE id NOT IN (user_a_id, user_b_id) ORDER BY RANDOM() LIMIT 1); -- Jugador aleatorio 3
    user_d_id UUID := (SELECT id FROM users WHERE id NOT IN (user_a_id, user_b_id, user_c_id) ORDER BY RANDOM() LIMIT 1); -- Jugador aleatorio 4
BEGIN
    -- Verificar que se encontraron suficientes usuarios
    IF user_a_id IS NULL OR user_b_id IS NULL OR user_c_id IS NULL OR user_d_id IS NULL THEN
        RAISE EXCEPTION 'No se encontraron suficientes usuarios únicos para el torneo de ejemplo. Asegúrate de tener al menos 4 usuarios en tu tabla "users".';
        RETURN;
    END IF;

    -- Crear el torneo completado
    INSERT INTO tournaments (name, description, start_date, end_date, active, category_id, venue)
    VALUES 
    ('Torneo de Verano Leyendas 2024', 'Un torneo épico con los mejores jugadores.', '2024-01-15', '2024-01-28', FALSE, cat_id, 'Club Principal')
    RETURNING id INTO new_tournament_id;

    -- Crear partidos jugados para este torneo
    -- Partido 1: User A vs User B (Gana User A)
    INSERT INTO matches (tournament_id, category_id, player1_id, player2_id, scheduled_date, venue, status, player1_confirmed, player2_confirmed, result_player1_sets, result_player2_sets, winner_id)
    VALUES
    (new_tournament_id, cat_id, user_a_id, user_b_id, '2024-01-16 10:00:00', 'Cancha 1', 'played', TRUE, TRUE, 2, 1, user_a_id);

    -- Partido 2: User C vs User D (Gana User D)
    INSERT INTO matches (tournament_id, category_id, player1_id, player2_id, scheduled_date, venue, status, player1_confirmed, player2_confirmed, result_player1_sets, result_player2_sets, winner_id)
    VALUES
    (new_tournament_id, cat_id, user_c_id, user_d_id, '2024-01-17 14:00:00', 'Cancha 2', 'played', TRUE, TRUE, 0, 2, user_d_id);

    -- Partido 3 (Final): User A vs User D (Gana User A)
    INSERT INTO matches (tournament_id, category_id, player1_id, player2_id, scheduled_date, venue, status, player1_confirmed, player2_confirmed, result_player1_sets, result_player2_sets, winner_id)
    VALUES
    (new_tournament_id, cat_id, user_a_id, user_d_id, '2024-01-27 16:00:00', 'Cancha Central', 'played', TRUE, TRUE, 3, 2, user_a_id);
    
    -- Partido por el tercer puesto
    INSERT INTO matches (tournament_id, category_id, player1_id, player2_id, scheduled_date, venue, status, player1_confirmed, player2_confirmed, result_player1_sets, result_player2_sets, winner_id)
    VALUES
    (new_tournament_id, cat_id, user_b_id, user_c_id, '2024-01-26 10:00:00', 'Cancha 3', 'played', TRUE, TRUE, 2, 0, user_b_id);

    RAISE NOTICE 'Torneo completado "Torneo de Verano Leyendas 2024" (ID: %) y sus partidos han sido creados.', new_tournament_id;
END $$;
