/* assets/yandex.js
   Minimal client for Yandex Disk public resources.
   IMPORTANT:
   - You must create a public (shared) folder link on Yandex Disk for each realm.
   - Insert those public share URLs into PUBLIC_KEYS below.
   - Example public share link: "https://yadi.sk/d/XXXXXXX" or "https://disk.yandex.com/d/XXXXXXX"
   - The script uses Yandex Cloud API endpoints:
     1) GET /v1/disk/public/resources?public_key=<PUBLIC_KEY>&fields=items.name,items.type,items.mime_type,items.size,items.path
     2) GET /v1/disk/public/resources/download?public_key=<PUBLIC_KEY>&path=<path> to obtain a temporary direct download URL
   - NOTE: If Yandex API changes, update endpoints accordingly.
*/

const YandexClient = (function () {
  const API_BASE = "https://cloud-api.yandex.net/v1/disk/public/resources";
  const DOWNLOAD_ENDPOINT = "https://cloud-api.yandex.net/v1/disk/public/resources/download";

  // USER: Replace these placeholders with your public Yandex share URLs per realm
  // Keep the keys exactly as realm identifiers used in realm pages: visuals,games,movies,music,memes,secrets
  const PUBLIC_KEYS = {
    visuals: "", // e.g. "https://yadi.sk/d/xxxx" OR "https://disk.yandex.com/d/xxxx"
    games: "",
    movies: "",
    music: "",
    memes: "",
    secrets: ""
  };

  // Helper: extract raw public_key param usable by the API (Yandex accepts full share link as public_key)
  function getPublicKeyForRealm(realm) {
    return PUBLIC_KEYS[realm] || null;
  }

  // Fetch folder listing (top-level items in the shared folder)
  // returns array of {name, type, mime_type, size, path}
  async function listPublicFiles(realm, options = {}) {
    const public_key = getPublicKeyForRealm(realm);
    if (!public_key) throw new Error(`No public key configured for realm "${realm}". Set it in /assets/yandex.js PUBLIC_KEYS.`);

    const params = new URLSearchParams();
    params.set("public_key", public_key);
    params.set("fields", "items.name,items.type,items.mime_type,items.size,items.path");
    if (options.limit) params.set("limit", options.limit);

    const url = `${API_BASE}?${params.toString()}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Yandex list error (${res.status}): ${text}`);
    }
    const json = await res.json();
    // Ensure items exist
    const items = Array.isArray(json.items) ? json.items : [];
    // Normalize
    return items.map((it) => ({
      name: it.name,
      type: it.type, // "file" or "dir"
      mime: it.mime_type || "",
      size: it.size || 0,
      path: it.path // path inside public resource
    }));
  }

  // Get direct download href for a specific path in the public resource
  // returns: {href: "https://..."}
  async function getDownloadLink(realm, path) {
    const public_key = getPublicKeyForRealm(realm);
    if (!public_key) throw new Error(`No public key configured for realm "${realm}".`);

    const params = new URLSearchParams();
    params.set("public_key", public_key);
    if (path) params.set("path", path);

    const url = `${DOWNLOAD_ENDPOINT}?${params.toString()}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Yandex download error (${res.status}): ${text}`);
    }
    const json = await res.json();
    return json; // { href: "direct-download-url", method: "GET" }
  }

  return {
    listPublicFiles,
    getDownloadLink,
    getPublicKeyForRealm
  };
})();
