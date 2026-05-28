
DROP POLICY IF EXISTS "inventory guest read" ON public.parts_inventory;
REVOKE EXECUTE ON FUNCTION public.assign_parts_guest(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_parts_guest(text) TO authenticated;
