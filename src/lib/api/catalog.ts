import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ScrapUnit } from "@/lib/domain/pickup";

export type CurrentRate = {
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  unit: ScrapUnit;
  sort_order: number;
  rate_per_unit: number;
  rate_updated_at: string;
};

export const currentRatesQuery = queryOptions({
  queryKey: ["current-rates"],
  queryFn: async (): Promise<CurrentRate[]> => {
    const { data, error } = await supabase.from("current_scrap_rates").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...r, rate_per_unit: Number(r.rate_per_unit) })) as CurrentRate[];
  },
});

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  unit: ScrapUnit;
  is_active: boolean;
  sort_order: number;
  scrap_rates: { id: string; rate_per_unit: number; effective_from: string }[];
};

export const adminCategoriesQuery = queryOptions({
  queryKey: ["admin-categories"],
  queryFn: async (): Promise<AdminCategory[]> => {
    const { data, error } = await supabase
      .from("scrap_categories")
      .select("id,name,slug,description,unit,is_active,sort_order,scrap_rates(id,rate_per_unit,effective_from)")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((c) => ({
      ...c,
      scrap_rates: [...c.scrap_rates]
        .map((r) => ({ ...r, rate_per_unit: Number(r.rate_per_unit) }))
        .sort((a, b) => b.effective_from.localeCompare(a.effective_from)),
    })) as AdminCategory[];
  },
});

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function saveCategory(input: {
  id?: string | undefined;
  name: string;
  description: string;
  unit: ScrapUnit;
  sort_order: number;
  is_active: boolean;
}) {
  const row = {
    name: input.name.trim(),
    slug: slugify(input.name),
    description: input.description.trim() || null,
    unit: input.unit,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };
  const q = input.id
    ? supabase.from("scrap_categories").update(row).eq("id", input.id).select("id").single()
    : supabase.from("scrap_categories").insert(row).select("id").single();
  const { data, error } = await q;
  if (error) throw error;
  return data.id;
}

export async function addRate(category_id: string, rate: number, userId: string) {
  const { error } = await supabase
    .from("scrap_rates")
    .insert({ category_id, rate_per_unit: rate, created_by: userId });
  if (error) throw error;
}
