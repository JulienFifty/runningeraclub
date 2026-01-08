-- Schema para integración con Strava
-- Ejecutar este script en Supabase SQL Editor

-- ============================================
-- 1. Tabla de conexiones de Strava
-- ============================================
CREATE TABLE IF NOT EXISTS strava_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE UNIQUE NOT NULL,
  strava_athlete_id BIGINT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  athlete_data JSONB DEFAULT '{}'::jsonb,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 2. Tabla de actividades de Strava
-- ============================================
CREATE TABLE IF NOT EXISTS strava_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  activity_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  distance DECIMAL(10, 2) NOT NULL, -- en metros
  moving_time INTEGER NOT NULL, -- en segundos
  elapsed_time INTEGER NOT NULL, -- en segundos
  total_elevation_gain DECIMAL(10, 2), -- en metros
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  average_speed DECIMAL(10, 2), -- en m/s
  max_speed DECIMAL(10, 2), -- en m/s
  kudos_count INTEGER DEFAULT 0,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 3. Tabla de estadísticas agregadas (cache)
-- ============================================
CREATE TABLE IF NOT EXISTS strava_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('week', 'month', 'year', 'alltime')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_distance DECIMAL(10, 2) DEFAULT 0, -- en km
  total_activities INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0, -- en segundos
  total_elevation DECIMAL(10, 2) DEFAULT 0, -- en metros
  run_distance DECIMAL(10, 2) DEFAULT 0, -- solo runs en km
  run_activities INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(member_id, period, period_start)
);

-- ============================================
-- 4. Índices para mejorar el rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_strava_connections_member ON strava_connections(member_id);
CREATE INDEX IF NOT EXISTS idx_strava_connections_athlete ON strava_connections(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_member ON strava_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_date ON strava_activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_strava_activities_type ON strava_activities(type);
CREATE INDEX IF NOT EXISTS idx_strava_stats_member ON strava_stats(member_id);
CREATE INDEX IF NOT EXISTS idx_strava_stats_period ON strava_stats(period, period_start);

-- ============================================
-- 5. Triggers para updated_at
-- ============================================
CREATE TRIGGER update_strava_connections_updated_at 
  BEFORE UPDATE ON strava_connections
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strava_stats_updated_at 
  BEFORE UPDATE ON strava_stats
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS (Row Level Security)
-- ============================================
ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_stats ENABLE ROW LEVEL SECURITY;

-- Los miembros pueden ver y editar su propia conexión
CREATE POLICY "Members can manage own Strava connection" ON strava_connections
  FOR ALL USING (auth.uid() = member_id);

-- Los miembros pueden ver sus propias actividades
CREATE POLICY "Members can view own activities" ON strava_activities
  FOR SELECT USING (auth.uid() = member_id);

-- Las actividades se insertan/actualizan via API (server-side)
CREATE POLICY "Service role can manage activities" ON strava_activities
  FOR ALL USING (true);

-- Los miembros pueden ver sus propias stats
CREATE POLICY "Members can view own stats" ON strava_stats
  FOR SELECT USING (auth.uid() = member_id);

-- Todos pueden ver stats de otros (para leaderboard)
CREATE POLICY "Public can view stats for leaderboard" ON strava_stats
  FOR SELECT USING (true);

-- Stats se actualizan via API (server-side)
CREATE POLICY "Service role can manage stats" ON strava_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update stats" ON strava_stats
  FOR UPDATE USING (true);

-- Los admins pueden ver todo
CREATE POLICY "Admins can view all Strava data" ON strava_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

CREATE POLICY "Admins can view all activities" ON strava_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- ============================================
-- 7. Comentarios
-- ============================================
COMMENT ON TABLE strava_connections IS 'Vinculaciones de cuentas de Strava de los miembros';
COMMENT ON TABLE strava_activities IS 'Actividades sincronizadas desde Strava';
COMMENT ON TABLE strava_stats IS 'Estadísticas agregadas para mejorar performance del leaderboard';

COMMENT ON COLUMN strava_activities.distance IS 'Distancia en metros';
COMMENT ON COLUMN strava_activities.moving_time IS 'Tiempo en movimiento en segundos';
COMMENT ON COLUMN strava_activities.average_speed IS 'Velocidad promedio en m/s';
COMMENT ON COLUMN strava_stats.total_distance IS 'Distancia total en kilómetros';

-- ============================================
-- 8. Función helper para calcular stats
-- ============================================
CREATE OR REPLACE FUNCTION calculate_member_stats(
  p_member_id UUID,
  p_period TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS void AS $$
BEGIN
  INSERT INTO strava_stats (
    member_id,
    period,
    period_start,
    period_end,
    total_distance,
    total_activities,
    total_time,
    total_elevation,
    run_distance,
    run_activities
  )
  SELECT 
    p_member_id,
    p_period,
    p_start_date,
    p_end_date,
    COALESCE(SUM(distance) / 1000, 0), -- metros a km
    COUNT(*),
    COALESCE(SUM(moving_time), 0),
    COALESCE(SUM(total_elevation_gain), 0),
    COALESCE(SUM(CASE WHEN type = 'Run' THEN distance / 1000 ELSE 0 END), 0),
    COUNT(CASE WHEN type = 'Run' THEN 1 END)
  FROM strava_activities
  WHERE member_id = p_member_id
    AND start_date >= p_start_date
    AND start_date < p_end_date
  ON CONFLICT (member_id, period, period_start)
  DO UPDATE SET
    total_distance = EXCLUDED.total_distance,
    total_activities = EXCLUDED.total_activities,
    total_time = EXCLUDED.total_time,
    total_elevation = EXCLUDED.total_elevation,
    run_distance = EXCLUDED.run_distance,
    run_activities = EXCLUDED.run_activities,
    updated_at = TIMEZONE('utc'::text, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_member_stats IS 'Calcula y guarda estadísticas de un miembro para un período específico';





