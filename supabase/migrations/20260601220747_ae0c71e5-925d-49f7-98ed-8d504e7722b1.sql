ALTER TABLE public.parts_collections
  ADD COLUMN confirmed_by uuid,
  ADD COLUMN confirmed_at timestamptz,
  ADD COLUMN status text NOT NULL DEFAULT 'pending';