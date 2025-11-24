/* assets/realm.js
   Supabase feed renderer for all six realms.
   Replaces JSON loading + keeps full UI from Dropbox version.
*/

(function () {

  // -------------------------------
  //  CONFIG
  // -------------------------------

  const BUCKET = "realms"; // your chosen bucket
  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_KEY = window.SUPABASE_KEY;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const ALLOWED_EXT = {
    visuals: ['jpg','jpeg','png','gif','webp','bmp','mp4','mkv','webm','avi','mov'],
    games: ['apk','exe','zip','rar','7z'],
    movies: ['mp4','mkv','webm','avi','mov','wmv','flv'],
    music: ['mp3','wav','flac','aac','ogg','m4a'],
    memes: ['jpg','jpeg','png','gif','webp','mp4','webm','mov'],
    secrets: null // accept all
  };

  const ICON_MAP = {
    image: '../assets/icons/image.svg',
    video: '../assets/icons/video.svg',
    audio: '../assets/icons/audio.svg',
    archive: '../assets/icons/archive.svg',
    exe: '../assets/icons/exe.svg',
    file: '../assets/icons/file.svg',
    secret: '../assets/icons/secret.svg'
  };

  // -------------------------------
  //  HELPERS
  // -------------------------------

  function humanFileSize(bytes, si = true) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) return bytes + ' B';
    const units = si
      ? ['KB','MB','GB','TB']
      : ['KiB','MiB','GiB','TiB'];
    let u = -1;
    do { bytes /= thresh; ++u; } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
  }

  function extFromName(name) {
    const idx = name.lastIndexOf('.');
    if (idx === -1) return '';
    return name.slice(idx + 1).toLowerCase();
  }

  function chooseIconForItem(name) {
    const ext = extFromName(name);
    if (/^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)) return ICON_MAP.image;
    if (/^(mp4|mkv|webm|avi|mov|wmv|flv)$/i.test(ext)) return ICON_MAP.video;
    if (/^(mp3|wav|flac|aac|ogg|m4a)$/i.test(ext)) return ICON_MAP.audio;
    if (/^(zip|rar|7z)$/i.test(ext)) return ICON_MAP.archive;
    if (/^(apk|exe)$/i.test(ext)) return ICON_MAP.exe;
    if (window.REALM === 'secrets') return ICON_MAP.secret;
    return ICON_MAP.file;
  }

  function classifyFileTypeClass(ext) {
    if (/^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)) return 'ft-image';
    if (/^(mp4|mkv|webm|avi|mov|wmv|flv)$/i.test(ext)) return 'ft-video';
    if (/^(mp3|wav|flac|aac|ogg|m4a)$/i.test(ext)) return 'ft-audio';
    if (/^(zip|rar|7z)$/i.test(ext)) return 'ft-archive';
    if (/^(apk|exe)$/i.test(ext)) return 'ft-app';
    return 'ft-file';
  }

  // -------------------------------
  //  RENDERING
  // -------------------------------

  function renderCard(item) {
    const { name, size, mime, url } = item;

    const card = document.createElement('article');
    card.className = 'card';

    const ext = extFromName(name);

    // Thumb
    const thumb = document.createElement('div');
    thumb.className = 'card-thumb';

    if (/^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)) {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = url;
      img.alt = name;
      thumb.appendChild(img);

    } else if (/^(mp4|webm|mkv|avi|mov|wmv|flv)$/i.test(ext)) {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.preload = "metadata";
      video.playsInline = true;
      video.style.objectFit = "cover";
      video.addEventListener("canplay", () => { try { video.play(); } catch(e){} });
      thumb.appendChild(video);

    } else {
      const icon = document.createElement('img');
      icon.src = chooseIconForItem(name);
      icon.style.width = "56px";
      icon.style.height = "56px";
      thumb.appendChild(icon);
    }

    card.appendChild(thumb);

    // Meta
    const meta = document.createElement('div');
    meta.className = 'card-meta';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'file-icon ' + classifyFileTypeClass(ext);
    const iconImg = document.createElement('img');
    iconImg.src = chooseIconForItem(name);
    iconImg.style.width = "22px";
    iconImg.style.height = "22px";
    iconWrap.appendChild(iconImg);

    const metaText = document.createElement('div');
    metaText.className = 'meta-text';

    const title = document.createElement('div');
    title.className = 'meta-title';
    title.textContent = name;

    const sub = document.createElement('div');
    sub.className = 'meta-sub';
    sub.textContent = `${mime} • ${humanFileSize(size)}`;

    metaText.appendChild(title);
    metaText.appendChild(sub);
    meta.appendChild(iconWrap);
    meta.appendChild(metaText);
    card.appendChild(meta);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const openBtn = document.createElement('a');
    openBtn.className = 'btn';
    openBtn.href = url;
    openBtn.target = "_blank";
    openBtn.rel = "noopener noreferrer";
    openBtn.textContent = "Open / Download";

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn secondary';
    copyBtn.textContent = "Copy link";
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = "Copied";
        setTimeout(()=>copyBtn.textContent="Copy link",1500);
      } catch(e){
        copyBtn.textContent="Error";
      }
    });

    actions.appendChild(openBtn);
    actions.appendChild(copyBtn);
    card.appendChild(actions);

    return card;
  }

  function showEmpty(container) {
    container.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'empty';
    el.textContent = "No files found in this realm yet.";
    container.appendChild(el);
  }

  // -------------------------------
  //  LOAD DATA FROM SUPABASE
  // -------------------------------

  async function loadRealmFromSupabase(realm) {
    const prefix = `${realm}/`;

    const { data, error } = await supabase
      .storage
      .from(BUCKET)
      .list(prefix, { limit: 2000 });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Build signed URLs for each item
    const items = [];
    for (const obj of data) {
      if (!obj.name) continue;
      const path = `${prefix}${obj.name}`;

      const { data: signed, error: signErr } = await supabase
        .storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60); // 1 hour

      if (!signed) continue;

      items.push({
        name: obj.name,
        size: obj.metadata?.size || 0,
        mime: obj.metadata?.mimetype || "file",
        url: signed.signedUrl
      });
    }

    return items;
  }

  // -------------------------------
  //  INIT
  // -------------------------------

  async function initRealm() {
    const realm = window.REALM;
    const container = document.getElementById('realm-feed');
    if (!container) return;

    container.innerHTML = `<div class="empty">Loading files…</div>`;

    try {
      const allowed = ALLOWED_EXT[realm];

      let items = await loadRealmFromSupabase(realm);

      if (allowed !== null) {
        items = items.filter(it => {
          const ext = extFromName(it.name);
          return allowed.includes(ext);
        });
      }

      if (items.length === 0) return showEmpty(container);

      items.sort((a,b)=>a.name.localeCompare(b.name, undefined, {sensitivity:"base"}));

      container.innerHTML = "";
      items.forEach(item => container.appendChild(renderCard(item)));

    } catch(e) {
      container.innerHTML = "";
      const el = document.createElement('div');
      el.className = 'empty';
      el.innerHTML = `Failed to load realm content.<br><small>${e.message}</small>`;
      container.appendChild(el);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.REALM) initRealm();
  });

})();
