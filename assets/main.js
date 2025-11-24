import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://zpjkouxgowehpyqmfssa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwamtvdXhnb3dlaHB5cW1mc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTY4NzcsImV4cCI6MjA3OTQ5Mjg3N30.xVbcxti5XGdcQtwWbR4C7OhCMJSsC6faox7RAPRDTKY"
);

export const BUCKET = "vault";

/* -------------------------
   LIST FILES
-------------------------- */
export async function listFiles(realm) {
  const { data, error } = await supabase.storage.from(BUCKET).list(realm, {
    limit: 5000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) return [];
  return data.filter(x => !x.name.endsWith(".keep"));
}

/* -------------------------
   LIST FOLDERS
-------------------------- */
export async function listFolders(realm) {
  const { data, error } = await supabase.storage.from(BUCKET).list(realm, {
    limit: 5000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) return [];
  return data.filter(x => x.metadata === null && x.name.endsWith("/") === false);
}

/* -------------------------
   CREATE FOLDER
   (uploads realm/folder/.keep)
-------------------------- */
export async function createFolder(realm, folder) {
  const path = `${realm}/${folder}/.keep`;
  const blob = new Blob([""], { type: "text/plain" });

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: false
  });

  return !error;
}

/* -------------------------
   PUBLIC URL
-------------------------- */
export function fileURL(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
