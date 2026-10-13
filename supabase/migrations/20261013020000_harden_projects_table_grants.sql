-- Harden the private projects table grants.
-- RLS remains the row-level boundary for authenticated users.
REVOKE ALL PRIVILEGES ON TABLE public.projects FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.projects FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO authenticated;
