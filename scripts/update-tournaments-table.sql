-- Agregar columna category_id a la tabla tournaments
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_tournaments_category_id ON tournaments(category_id);

-- Actualizar torneos existentes para que tengan una categoría por defecto (Primera)
UPDATE tournaments 
SET category_id = (SELECT id FROM categories WHERE name = 'Primera' LIMIT 1)
WHERE category_id IS NULL;

-- Crear función para enviar encuestas automáticamente cuando se crea un torneo
CREATE OR REPLACE FUNCTION send_tournament_survey()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el torneo está activo y tiene categoría, crear encuesta automáticamente
  IF NEW.active = true AND NEW.category_id IS NOT NULL THEN
    INSERT INTO tournament_registration_surveys (
      tournament_id,
      category_id,
      title,
      description,
      registration_deadline,
      questions,
      status
    ) VALUES (
      NEW.id,
      NEW.category_id,
      'Inscripción al ' || NEW.name,
      'Completa esta encuesta para inscribirte al torneo ' || NEW.name || '. Selecciona tus días y horarios disponibles.',
      NEW.start_date - INTERVAL '7 days', -- 7 días antes del inicio
      '[
        {
          "id": "available_days",
          "type": "checkbox",
          "question": "¿Qué días de la semana tienes disponible para jugar?",
          "options": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
          "required": true
        },
        {
          "id": "preferred_times",
          "type": "checkbox", 
          "question": "¿En qué horarios prefieres jugar?",
          "options": ["Mañana (8:00-12:00)", "Tarde (12:00-18:00)", "Noche (18:00-22:00)"],
          "required": true
        },
        {
          "id": "experience_level",
          "type": "select",
          "question": "¿Cuál es tu nivel de experiencia?", 
          "options": ["Principiante", "Intermedio", "Avanzado", "Profesional"],
          "required": true
        },
        {
          "id": "additional_info",
          "type": "textarea",
          "question": "Información adicional o comentarios",
          "required": false
        }
      ]'::jsonb,
      'open'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para ejecutar la función
DROP TRIGGER IF EXISTS tournament_survey_trigger ON tournaments;
CREATE TRIGGER tournament_survey_trigger
  AFTER INSERT OR UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION send_tournament_survey();
