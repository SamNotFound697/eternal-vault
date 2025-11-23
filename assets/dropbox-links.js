// dropbox-links.js
function makeDirectDropboxLink(url) {
    if (!url) return "";
    return url.replace(/(\?dl=)[01]/, "?dl=1");
}
