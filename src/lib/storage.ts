import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("ambientes").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export type Project = {
  id: string;
  title: string;
  description: string;
  style: string;
  upper_cabinets: any;
  lower_cabinets: any;
  original_path: string | null;
  analysis: any;
  analysis_status: string;
  analysis_error: string | null;
  render_path: string | null;
  render_status: string;
  render_error: string | null;
  render_model: string | null;
  created_at: string;
  updated_at: string;
};
