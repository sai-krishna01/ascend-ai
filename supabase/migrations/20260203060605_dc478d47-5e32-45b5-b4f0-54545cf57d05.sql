-- Create platform settings table for admin controls
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings FOR SELECT
USING (true);

-- Only admins/founders can update settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'founder'));

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "We are currently performing maintenance. Please check back soon."}', 'Enable/disable maintenance mode'),
  ('registration_enabled', '{"enabled": true}', 'Enable/disable new user registration'),
  ('ai_features_enabled', '{"enabled": true}', 'Enable/disable AI features');

-- Create custom pages table
CREATE TABLE public.custom_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

-- Everyone can read published pages
CREATE POLICY "Anyone can view published pages"
ON public.custom_pages FOR SELECT
USING (is_published = true);

-- Admins can view all pages
CREATE POLICY "Admins can view all pages"
ON public.custom_pages FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'founder'));

-- Admins can manage pages
CREATE POLICY "Admins can manage pages"
ON public.custom_pages FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'founder'));

-- Insert default pages
INSERT INTO public.custom_pages (slug, title, content) VALUES
  ('about', 'About Us', 'Welcome to MentorAI - Your AI-powered learning companion. We help students at all levels achieve their academic goals through personalized AI tutoring.'),
  ('contact', 'Contact Us', 'Have questions? Reach out to us at support@mentorai.com or use the form below.');

-- Create system alerts table
CREATE TABLE public.system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_active BOOLEAN DEFAULT true,
  show_on_pages TEXT[] DEFAULT ARRAY['all'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Everyone can view active alerts
CREATE POLICY "Anyone can view active alerts"
ON public.system_alerts FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Admins can manage alerts
CREATE POLICY "Admins can manage alerts"
ON public.system_alerts FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'founder'));

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_alerts;

-- Create trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_pages_updated_at
BEFORE UPDATE ON public.custom_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();