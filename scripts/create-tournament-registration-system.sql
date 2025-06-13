-- Crear tabla para encuestas de inscripción a torneos
CREATE TABLE IF NOT EXISTS tournament_registration_surveys (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Inscripción al Torneo',
    description TEXT,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    questions JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, category_id)
);

-- Crear tabla para inscripciones de jugadores a torneos
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES tournament_registration_surveys(id) ON DELETE CASCADE,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registration_type VARCHAR(20) DEFAULT 'survey' CHECK (registration_type IN ('survey', 'admin')),
    available_days JSONB DEFAULT '[]',
    preferred_times JSONB DEFAULT '[]',
    additional_info TEXT,
    responses JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registered_by UUID REFERENCES users(id),
    UNIQUE(tournament_id, category_id, user_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_tournament_registration_surveys_tournament_category 
ON tournament_registration_surveys(tournament_id, category_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_category 
ON tournament_registrations(tournament_id, category_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user 
ON tournament_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status 
ON tournament_registrations(status);

-- Actualizar tabla tournament_participants para usar las inscripciones
DROP TABLE IF EXISTS tournament_participants;

-- Crear vista para mantener compatibilidad
CREATE OR REPLACE VIEW tournament_participants AS
SELECT 
    tournament_id,
    category_id,
    user_id,
    status = 'confirmed' as active,
    registered_at as created_at
FROM tournament_registrations
WHERE status IN ('registered', 'confirmed');

-- Insertar datos de ejemplo para el torneo activo
INSERT INTO tournament_registration_surveys (tournament_id, category_id, title, description, registration_deadline, questions, status)
SELECT 
    t.id,
    c.id,
    'Inscripción al ' || t.name,
    'Completa tu inscripción al torneo. Selecciona los días que tienes disponible para jugar.',
    t.start_date + INTERVAL '7 days',
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
FROM tournaments t
CROSS JOIN categories c
WHERE t.active = true AND c.active = true
ON CONFLICT (tournament_id, category_id) DO NOTHING;

-- Registrar automáticamente usuarios activos en sus categorías
INSERT INTO tournament_registrations (
    survey_id, tournament_id, category_id, user_id, registration_type, 
    available_days, preferred_times, status, registered_by
)
SELECT 
    s.id,
    s.tournament_id,
    s.category_id,
    u.id,
    'admin',
    '["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]'::jsonb,
    '["Tarde (12:00-18:00)", "Noche (18:00-22:00)"]'::jsonb,
    'confirmed',
    u.id
FROM tournament_registration_surveys s
JOIN users u ON u.category::integer = s.category_id
WHERE u.active = true AND u.role = 'player'
ON CONFLICT (tournament_id, category_id, user_id) DO NOTHING;

COMMENT ON TABLE tournament_registration_surveys IS 'Encuestas de inscripción para torneos por categoría';
COMMENT ON TABLE tournament_registrations IS 'Inscripciones de jugadores a torneos con sus respuestas';
