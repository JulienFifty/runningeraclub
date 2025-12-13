-- Script para corregir las políticas RLS de miembros
-- Ejecuta este script si tienes el error "permission denied for table users"

-- Eliminar políticas existentes que puedan tener problemas
DROP POLICY IF EXISTS "Members can view own profile" ON members;
DROP POLICY IF EXISTS "Members can update own profile" ON members;
DROP POLICY IF EXISTS "Members can insert own profile" ON members;
DROP POLICY IF EXISTS "Admins can view all members" ON members;
DROP POLICY IF EXISTS "Members can view own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Members can create own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Members can update own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;

-- Eliminar función si existe
DROP FUNCTION IF EXISTS auth_user_email();

-- Crear función helper para obtener el email del usuario autenticado
-- SECURITY DEFINER permite que la función acceda a auth.users
CREATE OR REPLACE FUNCTION auth_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas para members
-- Los miembros solo pueden ver y editar su propio perfil
CREATE POLICY "Members can view own profile" ON members
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Members can update own profile" ON members
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Members can insert own profile" ON members
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Los administradores pueden ver todos los miembros
CREATE POLICY "Admins can view all members" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- Políticas para event_registrations
-- Los miembros pueden ver sus propios registros
CREATE POLICY "Members can view own registrations" ON event_registrations
  FOR SELECT USING (auth.uid() = member_id);

-- Los miembros pueden crear sus propios registros
CREATE POLICY "Members can create own registrations" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = member_id);

-- Los miembros pueden actualizar sus propios registros
CREATE POLICY "Members can update own registrations" ON event_registrations
  FOR UPDATE USING (auth.uid() = member_id);

-- Los administradores pueden ver todos los registros
CREATE POLICY "Admins can view all registrations" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- Los administradores pueden gestionar todos los registros
CREATE POLICY "Admins can manage all registrations" ON event_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

