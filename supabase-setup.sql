-- BuildProConnect Supabase Database Schema Setup
-- Run this script in the Supabase SQL Editor to initialize your database structure.

-- =========================================================================
-- 1. Enable Extensions
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 2. Create Schema Tables
-- =========================================================================

-- Profiles Table
-- Maps directly to auth.users. Automatically populated upon sign-up.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('agent', 'admin', 'client')),
  avatar_url text,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Properties Table
-- Real estate listings uploaded and managed by agents/admins.
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  property_type text NOT NULL CHECK (property_type IN ('apartment', 'house', 'land', 'commercial', 'studio')),
  listing_type text NOT NULL CHECK (listing_type IN ('sale', 'rent')),
  price numeric NOT NULL CHECK (price >= 0),
  bedrooms int2,
  bathrooms int2,
  area_sqm numeric CHECK (area_sqm > 0),
  location_city text NOT NULL,
  location_area text NOT NULL,
  location_address text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'sold', 'archived')),
  image_urls text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients Table
-- CRM contacts and leads managed by agents.
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  client_type text CHECK (client_type IN ('buyer', 'renter', 'seller', 'investor')),
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'closed', 'inactive')),
  notes text,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inquiries Table
-- Contact and questions sent by potential clients regarding properties.
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  client_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  sender_phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'closed')),
  agent_reply text,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Interactions Table
-- Logs of communications (calls, emails, meetings, etc.) with clients.
CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'site_visit', 'whatsapp', 'note')),
  summary text NOT NULL,
  outcome text,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Reminders Table
-- Tasks and calendar follow-ups for real estate agents.
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  title text NOT NULL,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- =========================================================================
-- 3. Row Level Security (RLS) Configuration
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. Safe Helper Utility Functions
-- =========================================================================

-- Helper function to check role of a user cleanly.
-- Marked as SECURITY DEFINER to bypass RLS and prevent infinite recursion on self-querying profiles.
CREATE OR REPLACE FUNCTION public.check_user_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =========================================================================
-- 5. Row Level Security Policies
-- =========================================================================

-- --- profiles policies ---
CREATE POLICY select_self_profile ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY update_self_profile ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- --- properties policies ---
-- Anyone (even anonymous browse visitors) can SELECT properties
CREATE POLICY select_public_properties ON public.properties
  FOR SELECT USING (true);

-- Agents and admins can manage listings
CREATE POLICY insert_properties ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY update_properties ON public.properties
  FOR UPDATE TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'))
  WITH CHECK (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY delete_properties ON public.properties
  FOR DELETE TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'));

-- --- clients policies ---
-- All client CRM data is accessible only by the assigned agent or admin
CREATE POLICY select_clients ON public.clients
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY insert_clients ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY update_clients ON public.clients
  FOR UPDATE TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'))
  WITH CHECK (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY delete_clients ON public.clients
  FOR DELETE TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'));

-- --- inquiries policies ---
-- Users can see their own sent messages, agents can see inquiries on their properties, admins can see all
CREATE POLICY select_inquiries ON public.inquiries
  FOR SELECT TO authenticated
  USING (
    client_profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = public.inquiries.property_id AND p.agent_id = auth.uid()
    ) OR
    public.check_user_role('admin')
  );

-- Any authenticated user can submit an inquiry
CREATE POLICY insert_inquiries ON public.inquiries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Assigned agents or admins can update inquiries (e.g. status changes, answering with reply)
CREATE POLICY update_inquiries ON public.inquiries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = public.inquiries.property_id AND p.agent_id = auth.uid()
    ) OR
    public.check_user_role('admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = public.inquiries.property_id AND p.agent_id = auth.uid()
    ) OR
    public.check_user_role('admin')
  );

-- --- interactions policies ---
CREATE POLICY select_interactions ON public.interactions
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY insert_interactions ON public.interactions
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY update_interactions ON public.interactions
  FOR UPDATE TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'))
  WITH CHECK (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY delete_interactions ON public.interactions
  FOR DELETE TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'));

-- --- reminders policies ---
CREATE POLICY select_reminders ON public.reminders
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY insert_reminders ON public.reminders
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY update_reminders ON public.reminders
  FOR UPDATE TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'))
  WITH CHECK (agent_id = auth.uid() OR public.check_user_role('admin'));

CREATE POLICY delete_reminders ON public.reminders
  FOR DELETE TO authenticated
  USING (agent_id = auth.uid() OR public.check_user_role('admin'));

-- =========================================================================
-- 6. Trigger: Automate Profile Entry Creation on Signup
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1), -- fallback to email prefix if full name metadata isn't set
      'New Client'
    ),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Safety drops for re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- 7. Trigger: Automate updated_at Column Updates
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Trigger for properties
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger for clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =========================================================================
-- 8. Storage Buckets (Manual Guideline for Dashboard)
-- =========================================================================
-- Please create the following storage buckets inside your Supabase Storage panel:
-- 
-- 1. [property-images]
--    - Name: property-images
--    - Public: true
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--    - Max file size: 5MB (5242880 bytes)
-- 
-- 2. [avatars]
--    - Name: avatars
--    - Public: true
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--    - Max file size: 5MB (5242880 bytes)
-- =========================================================================
