// assets/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Replace these with your project info
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * List files in a given bucket and optional folder
 * @param {string} bucket - bucket name (realm)
 * @param {string} folder - optional subfolder inside bucket
 * @returns array of file objects {name, url, mime, size}
 */
export async function listFiles(bucket, folder = '') {
    const path = folder ? `${folder}/` : '';
    const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(path, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' }});

    if (error) {
        console.error('Supabase listFiles error:', error);
        return [];
    }

    // Add public URLs
    const filesWithUrl = await Promise.all(data.map(async f => {
        const { publicURL } = supabase.storage.from(bucket).getPublicUrl(f.name);
        return {
            name: f.name,
            url: publicURL,
            size: f.size,
            mime: f.metadata?.mimetype || 'file'
        };
    }));

    return filesWithUrl;
}
