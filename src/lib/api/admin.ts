import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EnquiryInput, EnquiryStatus } from "@/lib/domain/admin";
import type { PickupStatus } from "@/lib/domain/pickup";

export const dashboardQuery = queryOptions({
  queryKey: ["admin-dashboard"],
  queryFn: async () => {
    const [orders, customers, enquiries] = await Promise.all([
      supabase.from("pickup_requests").select("id,request_code,customer_name,status,estimated_total,final_total,created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("contact_enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);
    if (orders.error) throw orders.error;
    if (customers.error) throw customers.error;
    if (enquiries.error) throw enquiries.error;
    return {
      orders: (orders.data ?? []).map((o) => ({ ...o, status: o.status as PickupStatus, estimated_total: Number(o.estimated_total), final_total: o.final_total == null ? null : Number(o.final_total) })),
      customerCount: customers.count ?? 0,
      newEnquiries: enquiries.count ?? 0,
    };
  },
});

export type Enquiry = {
  id: string; name: string; email: string | null; phone: string | null; message: string;
  status: EnquiryStatus; admin_notes: string | null; created_at: string;
};

export const enquiriesQuery = queryOptions({
  queryKey: ["admin-enquiries"],
  queryFn: async (): Promise<Enquiry[]> => {
    const { data, error } = await supabase.from("contact_enquiries").select("id,name,email,phone,message,status,admin_notes,created_at").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return data as Enquiry[];
  },
});

export async function submitEnquiry(e: EnquiryInput) {
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase.from("contact_enquiries").insert({
    name: e.name.trim(), email: e.email.trim() || null, phone: e.phone.trim() || null,
    message: e.message.trim(), user_id: data.user?.id ?? null,
  });
  if (error) throw error;
}

export async function updateEnquiry(id: string, patch: { status?: EnquiryStatus; admin_notes?: string | null }) {
  const { error } = await supabase.from("contact_enquiries").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteEnquiry(id: string) {
  const { error } = await supabase.from("contact_enquiries").delete().eq("id", id);
  if (error) throw error;
}

/** Deletes a category; if orders reference it, it is deactivated instead (server decides). */
export async function deleteCategory(id: string): Promise<"deleted" | "deactivated"> {
  const { data, error } = await supabase.rpc("delete_scrap_category", { _id: id });
  if (error) throw error;
  return data as "deleted" | "deactivated";
}

export async function deleteRate(id: string) {
  const { error } = await supabase.from("scrap_rates").delete().eq("id", id);
  if (error) throw error;
}
