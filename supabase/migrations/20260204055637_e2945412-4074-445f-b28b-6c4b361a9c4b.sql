-- Create pricing plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Create notes/resources sharing table
CREATE TABLE IF NOT EXISTS public.shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,
  created_by UUID NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

-- Pricing plans policies (public read, admin write)
CREATE POLICY "Anyone can view active pricing plans"
ON public.pricing_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage pricing plans"
ON public.pricing_plans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'founder'::app_role));

-- User subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'founder'::app_role));

-- Contact messages policies
CREATE POLICY "Anyone can create contact messages"
ON public.contact_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all contact messages"
ON public.contact_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'founder'::app_role));

CREATE POLICY "Admins can update contact messages"
ON public.contact_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'founder'::app_role));

-- Shared notes policies
CREATE POLICY "Public notes are viewable by all"
ON public.shared_notes FOR SELECT
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create notes"
ON public.shared_notes FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own notes"
ON public.shared_notes FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own notes"
ON public.shared_notes FOR DELETE
USING (auth.uid() = created_by);

CREATE POLICY "Teachers and admins can manage all notes"
ON public.shared_notes FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'founder'::app_role));

-- Insert default pricing plans
INSERT INTO public.pricing_plans (name, description, price, billing_period, features, is_popular, sort_order) VALUES
('Free', 'Get started with basic learning', 0, 'monthly', '["Access to basic subjects", "5 AI questions per day", "Community support", "Basic notes access"]'::jsonb, false, 1),
('Pro', 'For serious learners', 299, 'monthly', '["All Free features", "Unlimited AI questions", "All subjects access", "Group chat access", "Priority support", "Downloadable notes"]'::jsonb, true, 2),
('Premium', 'Complete learning suite', 599, 'monthly', '["All Pro features", "1-on-1 mentorship sessions", "Career counseling", "Mock interviews", "Exclusive content", "Certificate of completion"]'::jsonb, false, 3);

-- Add triggers for updated_at
CREATE TRIGGER update_pricing_plans_updated_at
BEFORE UPDATE ON public.pricing_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_notes_updated_at
BEFORE UPDATE ON public.shared_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();