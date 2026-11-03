CREATE OR REPLACE VIEW public.current_scrap_rates WITH (security_invoker = true) AS
 SELECT DISTINCT ON (c.id) c.id AS category_id, c.name, c.slug, c.description, c.unit, c.sort_order,
    r.rate_per_unit, r.effective_from AS rate_updated_at, c.image_url
   FROM public.scrap_categories c
     JOIN public.scrap_rates r ON r.category_id = c.id AND r.effective_from <= now()
  WHERE c.is_active
  ORDER BY c.id, r.effective_from DESC;