-- Remove the hardcoded admin user
DELETE FROM public.admin_roles 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'rhimemalcolm@gmail.com'
);