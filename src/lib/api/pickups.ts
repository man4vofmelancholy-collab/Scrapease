import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PickupStatus, ScrapUnit } from "@/lib/domain/pickup";

export type SubmitInput = {
  name: string;
  mobile: string;
  address: string;
  pincode: string;
  preferredDate: string | null;
  notes: string;
  items: { category_id: string; quantity: number }[];
};

export async function submitPickupRequest(input: SubmitInput) {
  const { data, error } = await supabase.rpc("submit_pickup_request", {
    _name: input.name,
    _mobile: input.mobile,
    _address: input.address,
    _pincode: input.pincode,
    _preferred_date: input.preferredDate as string,
    _notes: input.notes,
    _items: input.items,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("No request ID returned");
  return { requestCode: row.request_code, estimatedTotal: Number(row.estimated_total) };
}

export type PickupRequest = {
  id: string;
  request_code: string;
  customer_name: string;
  mobile: string;
  address: string;
  pincode: string;
  preferred_date: string | null;
  notes: string | null;
  status: PickupStatus;
  estimated_total: number;
  final_total: number | null;
  created_at: string;
  pickup_request_items: {
    id: string;
    category_name: string;
    quantity: number;
    unit: ScrapUnit;
    rate_snapshot: number;
    line_estimate: number;
  }[];
};

const SELECT =
  "id,request_code,customer_name,mobile,address,pincode,preferred_date,notes,status,estimated_total,final_total,created_at,pickup_request_items(id,category_name,quantity,unit,rate_snapshot,line_estimate)";

async function list(filter?: { customerId?: string; status?: PickupStatus | "all" }) {
  let q = supabase.from("pickup_requests").select(SELECT).order("created_at", { ascending: false }).limit(200);
  if (filter?.customerId) q = q.eq("customer_id", filter.customerId);
  if (filter?.status && filter.status !== "all") q = q.eq("status", filter.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as PickupRequest[];
}

export const myRequestsQuery = (userId: string) =>
  queryOptions({ queryKey: ["my-requests", userId], queryFn: () => list({ customerId: userId }) });

export const adminRequestsQuery = (status: PickupStatus | "all") =>
  queryOptions({ queryKey: ["admin-requests", status], queryFn: () => list({ status }) });

export async function updateRequestStatus(id: string, status: PickupStatus) {
  const { error } = await supabase.from("pickup_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function setFinalTotal(id: string, final_total: number) {
  const { error } = await supabase.from("pickup_requests").update({ final_total }).eq("id", id);
  if (error) throw error;
}
