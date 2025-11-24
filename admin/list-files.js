/* list-files.js
   Fetches and displays files for the current realm.
   Requires:
   - window.REALM set by each realm HTML
   - window.supabaseClient loaded by supabase.js
*/

(function () {
    async function loadRealmFeed() {
        if (!window.supabaseClient) {
            console.error("Supabase client not ready.");
            return;
        }
        if (!window.REALM) {
            console.error("REALM not set in page.");
            return;
        }

        const feed = document.getElementById("realm-feed");
        if (!feed) return;

        feed.innerHTML = "<p style='opacity:0.6'>Loading...</p>";

        // ---- Fetch metadata from DB ----
        const { data, error } = await window.supabaseClient
            .from("files")
            .select("*")
            .eq("realm", window.REALM)
            .order("id", { ascending: false });

        if (error) {
            feed.innerHTML = "<p>Error loading files.</p>";
            console.error(error);
            return;
        }

        if (!data.length) {
            feed.innerHTML = "<p style='opacity:0.6'>No files in this realm yet.</p>";
            return;
        }

        feed.innerHTML = "";

        // ---- Render each file ----
        data.forEach(file => {
            const card = document.createElement("div");
            card.className = "file-card";

            const ext = file.filename.split(".").pop().toLowerCase();
            const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
            const isVideo = ["mp4", "mkv", "webm", "mov", "avi"].includes(ext);
            const isAudio = ["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(ext);

            let inner = "";

            if (isImage) {
                inner = `<img src="${file.url}" class="file-thumb">`;
            } else if (isVideo) {
                inner = `<video src="${file.url}" class="file-thumb" muted></video>`;
            } else if (isAudio) {
                inner = `
                    <div class="file-generic audio">
                        <span>🎵 Audio File</span>
                    </div>`;
            } else {
                inner = `
                    <div class="file-generic">
                        <span>📄 ${ext.toUpperCase()}</span>
                    </div>`;
            }

            card.innerHTML = `
                <a href="${file.url}" target="_blank" class="file-link">
                    ${inner}
                    <div class="file-name">${file.filename}</div>
                </a>
            `;

            feed.appendChild(card);
        });
    }

    // Load instantly
    document.addEventListener("DOMContentLoaded", loadRealmFeed);

    // Refresh feed automatically when uploads occur
    document.addEventListener("file:uploaded", () => {
        loadRealmFeed();
    });

    // Expose simple reload if needed
    window.reloadRealmFeed = loadRealmFeed;

})();
