-- Script para insertar eventos de ejemplo en Supabase
-- Ejecuta este script en el SQL Editor de Supabase después de crear la tabla

-- Limpiar eventos existentes (opcional, descomenta si quieres empezar desde cero)
-- DELETE FROM events;

-- Insertar eventos de ejemplo
INSERT INTO events (
  slug, title, date, location, description, short_description, image, button_text, category,
  duration, distance, difficulty, price, max_participants, requirements, schedule, highlights, contact_info
) VALUES

-- Evento 1: Night Run
(
  'night-run',
  'Night Run',
  '15 Dic 2024',
  'Centro Histórico',
  'Corre bajo las estrellas por las calles iluminadas de Puebla. Una experiencia única que combina running urbano con la belleza nocturna de nuestra ciudad. Disfruta de un recorrido por los lugares más emblemáticos mientras te ejercitas en un ambiente relajado y comunitario.',
  'Corre bajo las estrellas por las calles iluminadas de Puebla.',
  '/assets/night-run.jpg',
  'REGÍSTRATE',
  'Carrera Urbana',
  '1.5 horas',
  '5K - 10K',
  'Intermedio',
  'Gratis para miembros',
  50,
  '["Ser miembro de RUNNING ERA", "Equipo de running con reflectores", "Hidratación personal"]'::jsonb,
  '[{"time": "19:00", "activity": "Registro y calentamiento"}, {"time": "19:30", "activity": "Inicio de la carrera"}, {"time": "21:00", "activity": "Estiramiento y networking"}]'::jsonb,
  '["Recorrido por el Centro Histórico iluminado", "Fotografía profesional incluida", "Refrigerio post-carrera", "Medalla conmemorativa"]'::jsonb,
  '{"email": "eventos@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
),

-- Evento 2: Trail Pietra
(
  'trail-pietra',
  'Trail Pietra',
  '22 Dic 2024',
  'Sierra de Puebla',
  'Aventura en montaña con vistas espectaculares. Desafía tus límites en esta ruta de trail running por la Sierra de Puebla. Conecta con la naturaleza mientras mejoras tu resistencia y técnica en terrenos variados.',
  'Aventura en montaña con vistas espectaculares.',
  '/assets/trail-run.jpg',
  'VER EVENTO',
  'Trail Running',
  '3 horas',
  '12K - 21K',
  'Avanzado',
  '$500 MXN',
  30,
  '["Experiencia previa en trail running", "Equipo de trail running adecuado", "Hidratación y nutrición para 3+ horas"]'::jsonb,
  '[{"time": "06:00", "activity": "Salida desde punto de encuentro"}, {"time": "07:00", "activity": "Llegada e inicio de carrera"}, {"time": "10:00", "activity": "Finalización y estiramiento"}]'::jsonb,
  '["Vistas panorámicas de la Sierra", "Guía profesional de montaña", "Apoyo médico en ruta", "Fotografía aérea con drone"]'::jsonb,
  '{"email": "trail@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
),

-- Evento 3: FIKA Social Run
(
  'fika-social-run',
  'FIKA Social Run',
  '28 Dic 2024',
  'Angelópolis',
  'Run + café + networking con la comunidad. Combina ejercicio con conexión social en este evento único. Después de una carrera relajada, disfruta de un café premium mientras conoces a otros miembros de la comunidad.',
  'Run + café + networking con la comunidad.',
  '/assets/community.jpg',
  'REGÍSTRATE',
  'Social',
  '2 horas',
  '3K - 5K',
  'Principiante',
  'Gratis para miembros',
  40,
  '["Ser miembro de RUNNING ERA", "Ropa cómoda para running"]'::jsonb,
  '[{"time": "08:00", "activity": "Registro y bienvenida"}, {"time": "08:30", "activity": "Carrera social"}, {"time": "09:30", "activity": "FIKA (café y networking)"}]'::jsonb,
  '["Café premium incluido", "Networking con la comunidad", "Ambiente relajado y social", "Fotografía de grupo"]'::jsonb,
  '{"email": "social@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
),

-- Evento 4: Lululemon Collab
(
  'lululemon-collab',
  'Lululemon Collab',
  '5 Ene 2025',
  'Lululemon Store',
  'Entrenamiento exclusivo con la marca premium. Colaboración especial con Lululemon para un entrenamiento de alta calidad. Accede a productos exclusivos y técnicas avanzadas de entrenamiento.',
  'Entrenamiento exclusivo con la marca premium.',
  '/assets/urban-run.jpg',
  'VER EVENTO',
  'Entrenamiento',
  '2 horas',
  'N/A',
  'Intermedio',
  'Gratis para miembros',
  25,
  '["Ser miembro de RUNNING ERA", "Ropa deportiva cómoda"]'::jsonb,
  '[{"time": "10:00", "activity": "Bienvenida y presentación de productos"}, {"time": "10:30", "activity": "Entrenamiento funcional"}, {"time": "11:30", "activity": "Sesión de Q&A y networking"}]'::jsonb,
  '["Acceso a productos Lululemon", "Descuentos exclusivos", "Entrenamiento con coaches certificados", "Goodie bag premium"]'::jsonb,
  '{"email": "collab@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
),

-- Evento 5: Sunrise Run
(
  'sunrise-run',
  'Sunrise Run',
  '12 Ene 2025',
  'Parque Ecológico',
  'Comienza el día corriendo al amanecer con la comunidad. Disfruta de los primeros rayos del sol mientras corres en un ambiente natural y tranquilo. Perfecto para empezar el día con energía positiva.',
  'Comienza el día corriendo al amanecer con la comunidad.',
  '/assets/hero-runners.jpg',
  'REGÍSTRATE',
  'Carrera Matutina',
  '1.5 horas',
  '5K',
  'Principiante',
  'Gratis para miembros',
  60,
  '["Ser miembro de RUNNING ERA", "Ropa cómoda para running"]'::jsonb,
  '[{"time": "06:30", "activity": "Registro y calentamiento"}, {"time": "07:00", "activity": "Inicio de la carrera"}, {"time": "08:00", "activity": "Estiramiento y desayuno ligero"}]'::jsonb,
  '["Amanecer en el parque", "Ambiente natural y relajado", "Desayuno ligero incluido", "Fotografía del amanecer"]'::jsonb,
  '{"email": "eventos@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
),

-- Evento 6: Trail Challenge
(
  'trail-challenge',
  'Trail Challenge',
  '19 Ene 2025',
  'Sierra Norte',
  'Desafío de trail running en las montañas de Puebla. Pon a prueba tu resistencia y habilidades técnicas en este desafío diseñado para corredores experimentados.',
  'Desafío de trail running en las montañas de Puebla.',
  '/assets/trail-run.jpg',
  'VER EVENTO',
  'Trail Running',
  '4 horas',
  '25K',
  'Avanzado',
  '$800 MXN',
  20,
  '["Experiencia avanzada en trail running", "Equipo completo de trail running", "Hidratación y nutrición para 4+ horas", "Certificado médico reciente"]'::jsonb,
  '[{"time": "05:00", "activity": "Salida desde punto de encuentro"}, {"time": "06:30", "activity": "Inicio del desafío"}, {"time": "10:30", "activity": "Finalización y premiación"}]'::jsonb,
  '["Ruta técnica y desafiante", "Apoyo completo en ruta", "Medalla y certificado de finalización", "Fotografía profesional"]'::jsonb,
  '{"email": "trail@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
),

-- Evento 7: Urban Night Run
(
  'urban-night-run',
  'Urban Night Run',
  '26 Ene 2025',
  'Zona Esmeralda',
  'Carrera nocturna urbana por las mejores zonas de la ciudad. Explora los rincones más modernos de Puebla mientras te ejercitas en un ambiente nocturno único.',
  'Carrera nocturna urbana por las mejores zonas de la ciudad.',
  '/assets/night-run.jpg',
  'REGÍSTRATE',
  'Carrera Urbana',
  '2 horas',
  '8K',
  'Intermedio',
  'Gratis para miembros',
  50,
  '["Ser miembro de RUNNING ERA", "Equipo de running con reflectores", "Hidratación personal"]'::jsonb,
  '[{"time": "19:00", "activity": "Registro y calentamiento"}, {"time": "19:30", "activity": "Inicio de la carrera"}, {"time": "21:00", "activity": "Networking y cierre"}]'::jsonb,
  '["Recorrido por Zona Esmeralda", "Iluminación especial", "Fotografía nocturna", "Refrigerio post-carrera"]'::jsonb,
  '{"email": "eventos@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
),

-- Evento 8: Community Run
(
  'community-run',
  'Community Run',
  '2 Feb 2025',
  'Centro Histórico',
  'Carrera comunitaria abierta a todos los niveles. Un evento inclusivo donde todos son bienvenidos, sin importar tu nivel de experiencia. Perfecto para principiantes y para conectar con la comunidad.',
  'Carrera comunitaria abierta a todos los niveles.',
  '/assets/community.jpg',
  'VER EVENTO',
  'Social',
  '1.5 horas',
  '3K - 5K',
  'Principiante',
  'Gratis para miembros',
  100,
  '["Ser miembro de RUNNING ERA", "Ropa cómoda para running"]'::jsonb,
  '[{"time": "08:00", "activity": "Registro y bienvenida"}, {"time": "08:30", "activity": "Carrera comunitaria"}, {"time": "09:30", "activity": "Actividades de integración"}]'::jsonb,
  '["Inclusivo para todos los niveles", "Ambiente familiar y acogedor", "Actividades post-carrera", "Fotografía de grupo"]'::jsonb,
  '{"email": "comunidad@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
),

-- Evento 9: Premium Training
(
  'premium-training',
  'Premium Training',
  '9 Feb 2025',
  'Estadio Cuauhtémoc',
  'Entrenamiento premium con coaches profesionales. Mejora tu técnica, velocidad y resistencia con sesiones dirigidas por entrenadores certificados en instalaciones de primer nivel.',
  'Entrenamiento premium con coaches profesionales.',
  '/assets/urban-run.jpg',
  'REGÍSTRATE',
  'Entrenamiento',
  '2 horas',
  'N/A',
  'Intermedio',
  '$600 MXN',
  30,
  '["Ser miembro de RUNNING ERA", "Ropa deportiva adecuada", "Hidratación personal"]'::jsonb,
  '[{"time": "09:00", "activity": "Bienvenida y evaluación inicial"}, {"time": "09:30", "activity": "Entrenamiento técnico"}, {"time": "11:00", "activity": "Sesión de fuerza y acondicionamiento"}, {"time": "11:30", "activity": "Estiramiento y cierre"}]'::jsonb,
  '["Coaches certificados", "Instalaciones premium", "Análisis de técnica personalizado", "Plan de entrenamiento individual"]'::jsonb,
  '{"email": "training@runningera.mx", "whatsapp": "+52 222 123 4567"}'::jsonb
);

-- Verificar que los eventos se insertaron correctamente
SELECT COUNT(*) as total_eventos FROM events;






