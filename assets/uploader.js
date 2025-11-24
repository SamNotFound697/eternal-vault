/* assets/uploader.js
   Client-side uploader for Supabase storage + DB metadata.
   Requires assets/supabase.js to run first (window.supabaseClient must exist).
*/

(function () {
  const ALLOWED_EXT = {
    visuals: ['jpg','jpeg','png','gif','webp','bmp','mp4','mkv','webm','avi','mov'],
    games: ['apk','exe','zip','rar','7z'],
    movies: ['mp4','mkv','webm','avi','mov','wmv','flv'],
    music: ['mp3','wav','flac','aac','ogg','m4a'],
    memes: ['jpg','jpeg','png','gif','webp','mp4','webm','mov'],
    secrets: null
  };

  function extFromName(name) {
    const idx = name.lastIndexOf('.');
    if (idx === -1) return '';
    return name.slice(idx + 1).toLowerCase();
  }

  // Public function: uploadFile(realm, folder, file, progressCallback)
  async function uploadFile(realm, folder, file, progressCallback) {
    if (!window.supabaseClient) throw new Error("Supabase client not ready. Ensure assets/supabase.js is loaded first.");

    // Validate
    const ext = extFromName(file.name);
    const allowed = ALLOWED_EXT[realm];
    if (allowed && !allowed.includes(ext)) {
      throw new Error(`Invalid file type .${ext} for realm "${realm}"`);
    }

    // Normalize folder (no leading/trailing slashes)
    folder = (folder || "root").replace(/^\/+|\/+$/g, "");

    // Build object path: folder/filename (we will allow overwrite prevention by prefixing timestamp)
    const safeName = `${Date.now()}_${file.name}`;

    // Upload to storage bucket (bucket name = realm)
    const { data: uploadData, error: uploadErr } = await window.supabaseClient.storage
      .from(realm)
      .upload(`${folder}/${safeName}`, file, { upsert: false });

    if (uploadErr) {
      // try upsert true if already exists
      if (uploadErr.message && uploadErr.message.includes("already exists")) {
        // fallback to upsert
        const { data: upData, error: upErr } = await window.supabaseClient.storage
          .from(realm)
          .upload(`${folder}/${safeName}`, file, { upsert: true });
        if (upErr) throw upErr;
      } else {
        throw uploadErr;
      }
    }

    // Build public URL
    const { publicURL, error: urlErr } = window.supabaseClient.storage.from(realm).getPublicUrl(`${folder}/${safeName}`);
    if (urlErr) throw urlErr;

    // Insert metadata into files table
    const meta = {
      realm,
      folder,
      filename: safeName,
      url: publicURL,
      mime: file.type || '',
      size: file.size || 0
    };

    const { data: dbRes, error: dbErr } = await window.supabaseClient
      .from('files')
      .insert([meta]);

    if (dbErr) {
      // If DB insert fails, attempt to remove storage object to avoid orphan files (best-effort)
      try { await window.supabaseClient.storage.from(realm).remove([`${folder}/${safeName}`]); } catch(e){}
      throw dbErr;
    }

    return { meta: dbRes && dbRes[0] ? dbRes[0] : meta };
  }

  // Small helper to wire an input element to upload action easily
  function attachUploader(buttonEl, realmSelectEl, folderInputEl, fileInputEl, statusEl) {
    buttonEl.addEventListener('click', async (e) => {
      e.preventDefault();
      const realm = realmSelectEl.value;
      const folder = folderInputEl.value || 'root';
      const file = fileInputEl.files && fileInputEl.files[0];
      if (!file) {
        statusEl.textContent = "No file chosen.";
        return;
      }
      statusEl.textContent = "Uploading...";
      try {
        const res = await uploadFile(realm, folder, file, (p)=>{});
        statusEl.textContent = "Upload complete.";
        // dispatch a custom event so page can refresh feed
        document.dispatchEvent(new CustomEvent('file:uploaded', { detail: res.meta }));
      } catch (err) {
        statusEl.textContent = "Upload failed: " + (err.message || err);
        console.error(err);
      }
    });
  }

  // expose functions globally
  window.EternalUploader = {
    uploadFile,
    attachUploader
  };

})();

