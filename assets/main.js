import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://zpjkouxgowehpyqmfssa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwamtvdXhnb3dlaHB5cW1mc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTY4NzcsImV4cCI6MjA3OTQ5Mjg3N30.xVbcxti5XGdcQtwWbR4C7OhCMJSsC6faox7RAPRDTKY"
);

export const BUCKET = "vault";

// Allowed extensions per realm
export const ALLOWED = {
  visuals: ["jpg","jpeg","png","gif","webp","bmp","mp4","mkv","webm","avi","mov"],
  games:   ["apk","exe","zip","rar","7z"],
  movies:  ["mp4","mkv","webm","avi","mov","wmv","flv"],
  music:   ["mp3","wav","flac","aac","ogg","m4a"],
  memes:   ["jpg","jpeg","png","gif","webp","mp4","webm","mov"],
  secrets: null   // accepts everything
};

export async function listFolders(realm, subfolder = "") {
  const prefix = subfolder ? `${realm}/${subfolder}/` : `${realm}/`;
  const { data } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (!data) return [];
  const folders = data.filter(x => x.metadata === null).map(x => ({ name: x.name }));
  return folders;
}

export async function listFiles(realm, subfolder = "") {
  const prefix = subfolder ? `${realm}/${subfolder}/` : `${realm}/`;
  const { data } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (!data) return [];
  return data
    .filter(x => x.metadata && !x.name.endsWith(".keep"))
    .map(x => ({ ...x, path: subfolder ? `${realm}/${subfolder}/${x.name}` : `${realm}/${x.name}` }));
}

export async function createFolder(realm, subfolder, name) {
  const path = `${realm}/${subfolder ? subfolder + '/' : ''}${name}/.keep`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, new Blob([""]), { upsert: false });
  return !error;
}

export function fileURL(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
