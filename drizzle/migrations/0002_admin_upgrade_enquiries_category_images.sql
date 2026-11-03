CREATE TYPE public.enquiry_status AS ENUM ('new','in_progress','resolved');

CREATE TABLE public.contact_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 100),
  email text CHECK (email IS NULL OR (char_length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text CHECK (phone IS NULL OR phone ~ '^[0-9+\- ]{7,15}$'),
  message text NOT NULL CHECK (char_length(trim(message)) BETWEEN 5 AND 2000),
  status public.enquiry_status NOT NULL DEFAULT 'new',
  admin_notes text CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 2000),
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
GRANT INSERT ON public.contact_enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_enquiries TO authenticated;
GRANT ALL ON public.contact_enquiries TO service_role;
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone submits enquiry" ON public.contact_enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new' AND admin_notes IS NULL AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "admin reads enquiries" ON public.contact_enquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin updates enquiries" ON public.contact_enquiries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin deletes enquiries" ON public.contact_enquiries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER contact_enquiries_touch BEFORE UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.scrap_categories ADD COLUMN image_url text
  CHECK (image_url IS NULL OR image_url ~* '^https://');

GRANT DELETE ON public.scrap_rates TO authenticated;
CREATE POLICY "admin deletes rates" ON public.scrap_rates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.delete_scrap_category(_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete categories';
  END IF;
  IF EXISTS (SELECT 1 FROM public.pickup_request_items WHERE category_id = _id) THEN
    UPDATE public.scrap_categories SET is_active = false WHERE id = _id;
    RETURN 'deactivated';
  END IF;
  DELETE FROM public.scrap_rates WHERE category_id = _id;
  DELETE FROM public.scrap_categories WHERE id = _id;
  RETURN 'deleted';
END $$;
REVOKE EXECUTE ON FUNCTION public.delete_scrap_category(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_scrap_category(uuid) TO authenticated;