import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return { user: null, isAdmin: false };
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return { user, isAdmin: !!isAdmin };
    },
    staleTime: 60_000,
  });
  return { user: data?.user ?? null, isAdmin: data?.isAdmin ?? false, isLoading };
}
