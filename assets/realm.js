/* assets/realm.js
   Dropbox feed renderer for all six realms.
   Depends on dropbox-links.js (makeDirectDropboxLink).
*/

(function () {
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

  function humanFileSize(bytes, si = true) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) return bytes + ' B';
    const units = si
      ? ['KB','MB','GB','TB','PB','EB','ZB','YB']
      : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    let u = -1;
    do { bytes /= thresh; ++u; } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
  }

  function extFromName(name) {
    const idx = name.lastIndexOf('.');
    if (idx === -1) return '';
    return name.slice(idx + 1).toLowerCase();
  }

  function chooseIconForItem(item) {
    const ext = extFromName(item.url || item.name);
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

  function renderCard(item) {
    const downloadHref = makeDirectDropboxLink(item.url);

    const card = document.createElement('article');
    card.className = 'card';

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'card-thumb';
    const ext = extFromName(item.url || item.name);

    if (/^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)) {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = downloadHref;
      img.alt = item.name;
      thumb.appendChild(img);
    } else if (/^(mp4|webm|mkv|avi|mov|wmv|flv)$/i.test(ext)) {
      const video = document.createElement('video');
      video.src = downloadHref;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.loop = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.addEventListener('canplay', () => { try { video.play(); } catch(e){} });
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

    // Meta
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
      try { await navigator.clipboard.writeText(downloadHref); copyBtn.textContent='Copied';
            setTimeout(()=>copyBtn.textContent='Copy link',1500);
      } catch(e){ copyBtn.textContent='Copy failed'; setTimeout(()=>copyBtn.textContent='Copy link',1500);}
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
    el.textContent = 'No files found in this realm yet. Be the first to upload!';
    container.appendChild(el);
  }

  async function initRealm() {
    const realm = window.REALM;
    const container = document.getElementById('feed');
    if (!container) return;

    container.innerHTML = '<div class="empty">Loading files…</div>';

    try {
      const resp = await fetch(`../content/${realm}.json`);
      if (!resp.ok) throw new Error('Failed to load JSON');
      const items = await resp.json();

      if (!items || items.length === 0) {
        showEmpty(container);
        return;
      }

      // Filter allowed extensions
      const allowed = ALLOWED_EXT[realm];
      const filtered = items.filter(it => {
        if (!it.url) return false;
        const ext = extFromName(it.url);
        return allowed === null || allowed.includes(ext);
      });

      if (filtered.length === 0) {
        showEmpty(container);
        return;
      }

      // Sort by name
      filtered.sort((a,b) => a.name.localeCompare(b.name, undefined, {sensitivity:'base'}));

      container.innerHTML = '';
      filtered.forEach(item => container.appendChild(renderCard(item)));

    } catch(e) {
      container.innerHTML='';
      const el=document.createElement('div');
      el.className='empty';
      el.innerHTML=`Failed to load realm content.<br><small>${e.message}</small>`;
      container.appendChild(el);
      console.error(e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.REALM === 'string' && window.REALM.length) initRealm();
  });

})();
