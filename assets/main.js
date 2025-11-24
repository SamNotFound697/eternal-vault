import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://zpjkouxgowehpyqmfssa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwamtvdXhnb3dlaHB5cW1mc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTY4NzcsImV4cCI6MjA3OTQ5Mjg3N30.xVbcxti5XGdcQtwWbR4C7OhCMJSsC6faox7RAPRDTKY"
);

// Base bucket name
export const BUCKET = "vault";

// List files in a folder (realm)
export async function listFiles(folder) {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 5000,
    sortBy: { column: "name", order: "desc" }
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

// Get public URL
export function fileURL(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
