-- Create a function to promote a user to admin/founder by email
CREATE OR REPLACE FUNCTION public.promote_to_role(_email TEXT, _role app_role)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  
  IF _user_id IS NULL THEN
    RETURN 'User not found with email: ' || _email;
  END IF;
  
  -- Delete existing role and insert new one
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role);
  
  RETURN 'Successfully promoted ' || _email || ' to ' || _role::TEXT;
END;
$$;