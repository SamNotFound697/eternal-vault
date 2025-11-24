import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://zpjkouxgowehpyqmfssa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwamtvdXhnb3dlaHB5cW1mc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTY4NzcsImV4cCI6MjA3OTQ5Mjg3N30.xVbcxti5XGdcQtwWbR4C7OhCMJSsC6faox7RAPRDTKY"
);

// Base bucket
export const BUCKET = "vault";

/* ===========================================================
   REAL FOLDER SUPPORT FOR SUPABASE (prefix-based)
   =========================================================== */

/* ----------------------------
   Create a “folder” by uploading .keep
---------------------------- */
export async function createFolder(realm, folderName) {
  const fullPath = `${realm}/${folderName}/.keep`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fullPath, new Blob([""], { type: "text/plain" }), {
      upsert: false
    });

  return !error;
}

/* ----------------------------
   List ONLY folders inside a realm
---------------------------- */
export async function listFolders(realm) {
  const { data, error } = await supabase.storage.from(BUCKET).list(realm, {
    limit: 5000
  });

  if (error) {
    console.error(error);
    return [];
  }

  // Folders have no metadata
  return data.filter(item => item.metadata === null);
}

/* ----------------------------
   List ONLY real files (not folders)
---------------------------- */
export async function listFiles(realm) {
  const { data, error } = await supabase.storage.from(BUCKET).list(realm, {
    limit: 5000
  });

  if (error) {
    console.error(error);
    return [];
  }

  // Files have metadata
  return data.filter(item => item.metadata !== null);
}

/* ----------------------------
   Public URL builder
---------------------------- */
export function fileURL(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
