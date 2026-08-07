-- Track demo seed batches for one-click wipe (applied remotely 2026-08-07)
CREATE TABLE IF NOT EXISTS public.demo_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  host_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_ids UUID[] NOT NULL DEFAULT '{}',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_batches_host_org_idx
  ON public.demo_batches (host_organization_id);

ALTER TABLE public.demo_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS demo_batches_select_own ON public.demo_batches;
CREATE POLICY demo_batches_select_own ON public.demo_batches
  FOR SELECT USING (
    host_organization_id = public.current_org_id()
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS demo_batches_insert_own ON public.demo_batches;
CREATE POLICY demo_batches_insert_own ON public.demo_batches
  FOR INSERT WITH CHECK (
    host_organization_id = public.current_org_id()
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS demo_batches_delete_own ON public.demo_batches;
CREATE POLICY demo_batches_delete_own ON public.demo_batches
  FOR DELETE USING (
    host_organization_id = public.current_org_id()
    OR public.is_platform_admin()
  );

COMMENT ON TABLE public.demo_batches IS 'Tracks seeded demo orgs/rows for bulk wipe from Demo Data UI';
