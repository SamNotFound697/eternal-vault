/* assets/realm.js
   Realm page renderer. Works with window.REALM (set inside each realm HTML).
   Depends on yandex.js being loaded.
*/

(function () {
  const ALLOWED_EXT = {
    visuals: ['jpg','jpeg','png','gif','webp','bmp','mp4','mkv','webm','avi','mov'],
    games: ['apk','exe','zip','rar','7z'],
    movies: ['mp4','mkv','webm','avi','mov','wmv','flv'],
    music: ['mp3','wav','flac','aac','ogg','m4a'],
    memes: ['jpg','jpeg','png','gif','webp','mp4','webm','mov'],
    secrets: null // null = accept every file
  };

  const ICON_MAP = {
    image: '/assets/icons/image.svg',
    video: '/assets/icons/video.svg',
    audio: '/assets/icons/audio.svg',
    archive: '/assets/icons/archive.svg',
    exe: '/assets/icons/exe.svg',
    file: '/assets/icons/file.svg',
    secret: '/assets/icons/secret.svg'
  };

  function humanFileSize(bytes, si = true) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) return bytes + ' B';
    const units = si
      ? ['KB','MB','GB','TB','PB','EB','ZB','YB']
      : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    let u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
  }

  function extFromName(name) {
    const idx = name.lastIndexOf('.');
    if (idx === -1) return '';
    return name.slice(idx + 1).toLowerCase();
  }

  function chooseIconForItem(item) {
    const ext = extFromName(item.name);
    if (/^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)) return ICON_MAP.image;
    if (/^(mp4|mkv|webm|avi|mov|wmv|flv)$/i.test(ext)) return ICON_MAP.video;
    if (/^(mp3|wav|flac|aac|ogg|m4a)$/i.test(ext)) return ICON_MAP.audio;
    if (/^(zip|rar|7z)$/i.test(ext)) return ICON_MAP.archive;
    if (/^(apk|exe)$/i.test(ext)) return ICON_MAP.exe;
    if (window.REALM === 'secrets') return ICON_MAP.secret;
    return ICON_MAP.file;
  }

  // Render a single card element
  function renderCard(item, downloadHref) {
    const card = document.createElement('article');
    card.className = 'card';

    // Thumbnail area
    const thumb = document.createElement('div');
    thumb.className = 'card-thumb';
    // If image - show actual image; if video - try to show poster via <video> (muted) as preview; else icon
    const ext = extFromName(item.name);
    if (/^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)) {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = downloadHref; // direct link
      img.alt = item.name;
      thumb.appendChild(img);
    } else if (/^(mp4|webm|mkv|avi|mov|wmv|flv)$/i.test(ext)) {
      // For videos, embed a small <video> tag with controls=0 and muted autoplay loop (browser policies may block autoplay)
      const video = document.createElement('video');
      video.src = downloadHref;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.loop = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      // Try to play - but ignore errors (some browsers block autoplay)
      video.addEventListener('canplay', () => {
        try { video.play(); } catch (e) {}
      });
      thumb.appendChild(video);
    } else {
      const icon = document.createElement('img');
      icon.src = chooseIconForItem(item);
      icon.alt = 'file';
      icon.style.width = '56px';
      icon.style.height = '56px';
      thumb.appendChild(icon);
    }
    card.appendChild(thumb);

    // Meta row
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const fileIcon = document.createElement('div');
    fileIcon.className = 'file-icon ' + classifyFileTypeClass(ext);
    const iconImg = document.createElement('img');
    iconImg.src = chooseIconForItem(item);
    iconImg.alt = '';
    iconImg.style.width = '22px';
    iconImg.style.height = '22px';
    fileIcon.appendChild(iconImg);

    const metaText = document.createElement('div');
    metaText.className = 'meta-text';
    const title = document.createElement('div');
    title.className = 'meta-title';
    title.textContent = item.name;
    const sub = document.createElement('div');
    sub.className = 'meta-sub';
    sub.textContent = `${item.mime || 'file'} • ${humanFileSize(item.size || 0)}`;
    metaText.appendChild(title);
    metaText.appendChild(sub);

    meta.appendChild(fileIcon);
    meta.appendChild(metaText);
    card.appendChild(meta);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const openBtn = document.createElement('a');
    openBtn.className = 'btn';
    openBtn.href = downloadHref;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    openBtn.textContent = 'Open / Download';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn secondary';
    copyBtn.textContent = 'Copy link';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(downloadHref);
        copyBtn.textContent = 'Copied';
        setTimeout(() => (copyBtn.textContent = 'Copy link'), 1500);
      } catch (e) {
        copyBtn.textContent = 'Copy failed';
        setTimeout(() => (copyBtn.textContent = 'Copy link'), 1500);
      }
    });

    actions.appendChild(openBtn);
    actions.appendChild(copyBtn);
    card.appendChild(actions);

    return card;
  }

  // Map extension to file-icon class for subtle color
  function classifyFileTypeClass(ext) {
    if (/^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)) return 'ft-image';
    if (/^(mp4|mkv|webm|avi|mov|wmv|flv)$/i.test(ext)) return 'ft-video';
    if (/^(mp3|wav|flac|aac|ogg|m4a)$/i.test(ext)) return 'ft-audio';
    if (/^(zip|rar|7z)$/i.test(ext)) return 'ft-archive';
    if (/^(apk|exe)$/i.test(ext)) return 'ft-app';
    return 'ft-file';
  }

  // Render empty state
  function showEmpty(container) {
    container.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'empty';
    el.textContent = 'No files found in this realm yet. Be the first to upload!';
    container.appendChild(el);
  }

  // Main rendering flow
  async function initRealm() {
    const realm = window.REALM;
    const container = document.getElementById('realm-feed');
    if (!container) return;

    // Visual cue while loading
    container.innerHTML = '<div class="empty">Loading files…</div>';

    try {
      // 1) Get listing from Yandex (top-level items of the public folder)
      const items = await YandexClient.listPublicFiles(realm, { limit: 500 });
      if (!items || items.length === 0) {
        showEmpty(container);
        return;
      }

      // 2) Filter by allowed extensions for this realm
      const allowed = ALLOWED_EXT[realm]; // array or null
      const filtered = items.filter((it) => {
        if (it.type && it.type === 'dir') return false; // ignore directories
        if (!it.name) return false;
        const ext = extFromName(it.name);
        if (!ext) return allowed === null; // secrets allow all
        if (allowed === null) return true;
        return allowed.includes(ext);
      });

      if (filtered.length === 0) {
        showEmpty(container);
        return;
      }

      // sort by name (you can change to size/date if available)
      filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

      // 3) For each file, get a temporary direct download href and render card
      container.innerHTML = ''; // clear loading
      // Limit concurrent download-link requests to avoid throttling
      const CONCURRENCY = 6;
      let idx = 0;

      async function worker() {
        while (idx < filtered.length) {
          const i = idx++;
          const item = filtered[i];
          try {
            // get direct download link
            const dlResp = await YandexClient.getDownloadLink(realm, item.path);
            const href = dlResp && dlResp.href ? dlResp.href : null;
            if (!href) throw new Error('No download href');

            const card = renderCard(item, href);
            container.appendChild(card);
          } catch (err) {
            // On error, append a minimal fallback card with info
            const fallback = document.createElement('div');
            fallback.className = 'card';
            fallback.innerHTML = `<div class="card-meta"><div class="meta-text"><div class="meta-title">${escapeHtml(item.name || 'file')}</div><div class="meta-sub">Failed to load preview — still available via Yandex folder</div></div></div>`;
            container.appendChild(fallback);
            console.warn('Item render error', item, err);
          }
        }
      }

      // Kick off concurrent workers
      const workers = [];
      for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
      await Promise.all(workers);

    } catch (err) {
      console.error(err);
      container.innerHTML = '';
      const el = document.createElement('div');
      el.className = 'empty';
      el.innerHTML = `Failed to load folder. Make sure the realm's public Yandex share link is set in <code>/assets/yandex.js</code>. <br><br><small>${escapeHtml(err.message || 'Unknown error')}</small>`;
      container.appendChild(el);
    }
  }

  // Small helpers
  function extFromName(name) {
    const idx = name.lastIndexOf('.');
    if (idx === -1) return '';
    return name.slice(idx + 1).toLowerCase();
  }
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"'`]/g, (s) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[s];
    });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // Only run on realm pages with window.REALM
    if (typeof window.REALM === 'string' && window.REALM.length) {
      initRealm();
    }
  });
})();
