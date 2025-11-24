/* assets/supabase.js
   Loads supabase client and exposes window.supabase (ready to use by other scripts).
   Replace SUPABASE_URL and SUPABASE_ANON_KEY with your real values.
*/

(function () {
  // <-- REPLACED WITH YOUR PROJECT VALUES -->
  window.SUPABASE_URL = "https://zpjkouxgowehpyqmfssa.supabase.co";
  window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwamtvdXhnb3dlaHB5cW1mc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTY4NzcsImV4cCI6MjA3OTQ5Mjg3N30.xVbcxti5XGdcQtwWbR4C7OhCMJSsC6faox7RAPRDTKY";
  // ----------------------------------------------------

  // create a loader that imports the ESM supabase client and exposes a ready client at window.supabaseClient
  async function init() {
    try {
      // dynamic import from jsDelivr ESM build
      const module = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
      // module.createClient is available
      window.supabaseClient = module.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

      // For backwards compatibility with some older code expecting window.supabase.createClient
      window.supabase = {
        createClient: (url, key) => module.createClient(url, key)
      };

      // also attach convenience alias
      window.supabaseReady = true;
      console.info("Supabase client loaded.");
    } catch (err) {
      console.error("Failed to load Supabase client:", err);
      window.supabaseReady = false;
    }
  }

  // start initialization immediately
  init();
})();
