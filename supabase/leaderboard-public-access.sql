-- Política para permitir acceso público a datos del leaderboard
-- Esta política permite que cualquier usuario (autenticado o no) vea
-- información pública de miembros para el leaderboard

-- Política pública para ver nombres e imágenes de perfil de miembros
-- (necesario para el leaderboard público)
CREATE POLICY "Public can view leaderboard member info" ON members
  FOR SELECT USING (true);

-- También para event_registrations (necesario para leaderboard de eventos)
CREATE POLICY "Public can view event registrations for leaderboard" ON event_registrations
  FOR SELECT USING (true);

-- Para strava_connections (necesario para fotos de perfil)
CREATE POLICY "Public can view Strava profile images" ON strava_connections
  FOR SELECT USING (true);

-- Para strava_activities (necesario para stats del leaderboard)
CREATE POLICY "Public can view Strava activities for leaderboard" ON strava_activities
  FOR SELECT USING (true);

