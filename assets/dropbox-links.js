// dropbox-links.js
// Converts Dropbox shared links to direct links (dl=1)

function makeDirectDropboxLink(url) {
    if (!url) return "";
    return url.replace(/(\?dl=)[01]/, "?dl=1");
}

// Example usage: you can call this when generating your feed cards
// let originalLink = "https://www.dropbox.com/scl/...&dl=0";
// let directLink = makeDirectDropboxLink(originalLink);
