import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* -------------------------
   SUPABASE CLIENT
-------------------------- */
export const supabase = createClient(
  "https://zpjkouxgowehpyqmfssa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwamtvdXhnb3dlaHB5cW1mc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTY4NzcsImV4cCI6MjA3OTQ5Mjg3N30.xVbcxti5XGdcQtwWbR4C7OhCMJSsC6faox7RAPRDTKY"
);

/* -------------------------
   MASTER BUCKET
-------------------------- */
export const BUCKET = "vault";

/* -------------------------
   REALM MAPPING
-------------------------- */
const REALMS = ["visuals", "games", "movies", "music", "memes", "secrets"];

/* -------------------------
   LIST FILES IN REALM/FOLDER
-------------------------- */
export async function listFiles(realm, folder = "") {
  const prefix = folder ? `${realm}/${folder}` : realm;

  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 5000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) return [];

  // ignore folders + .keep
  return data.filter(x => x.metadata && !x.name.endsWith(".keep"));
}

/* -------------------------
   LIST FOLDERS IN REALM
-------------------------- */
export async function listFolders(realm) {
  const { data, error } = await supabase.storage.from(BUCKET).list(realm, {
    limit: 5000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) return [];

  // folders have: metadata === null AND NOT a file
  return data.filter(x => x.metadata === null);
}

/* -------------------------
   CREATE FOLDER
   (Supabase = create prefix by uploading .keep)
-------------------------- */
export async function createFolder(realm, folder) {
  const path = `${realm}/${folder}/.keep`;
  const emptyFile = new Blob([""], { type: "text/plain" });

  const { error } = await supabase.storage.from(BUCKET).upload(path, emptyFile, {
    upsert: false
  });

  return !error;
}

/* -------------------------
   GENERATE PUBLIC URL
-------------------------- */
export function fileURL(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
