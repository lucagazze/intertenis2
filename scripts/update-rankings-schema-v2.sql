-- Script para actualizar el esquema de la base de datos para el nuevo sistema de rankings.
-- Versión 2.

-- 1. Añadir la columna 'bonus_points' a la tabla 'users'.
-- La API tomará los puntos bonus de aquí. Si no existe, se usará 0.
-- Puedes actualizar los valores para cada usuario según necesites desde la tabla de Supabase.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0;

-- 2. Añadir las columnas necesarias a la tabla 'rankings'.
-- Estas columnas almacenarán las estadísticas detalladas calculadas por la API.
ALTER TABLE public.rankings
ADD COLUMN IF NOT EXISTS sets_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sets_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS games_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS games_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS partial_average REAL DEFAULT 0.0;

-- 3. Asegurar que la columna 'average' en 'rankings' sea del tipo correcto.
-- La usaremos para el promedio final, que es un número con decimales.
-- Usamos REAL que es un tipo de punto flotante de precisión simple.
ALTER TABLE public.rankings
ALTER COLUMN average TYPE REAL;

-- 4. Comentario final:
-- Después de ejecutar este script, ve a la aplicación y usa el botón "Actualizar Rankings"
-- en una de las tablas. Esto ejecutará la API que llenará estas nuevas columnas
-- con los datos calculados.
SELECT 'Esquema de rankings actualizado correctamente. Por favor, ejecuta la actualización desde la aplicación.' as status;
