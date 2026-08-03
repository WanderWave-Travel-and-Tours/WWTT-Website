// Swaps preloaded stylesheet <link>s to rel="stylesheet" once they've loaded.
// Equivalent to onload="this.onload=null;this.rel='stylesheet'" but external,
// so it works without 'unsafe-inline' in script-src.
(function () {
  ['google-fonts-preload', 'fontawesome-preload'].forEach(function (id) {
    var link = document.getElementById(id);
    if (!link) return;
    link.onload = function () {
      link.onload = null;
      link.rel = 'stylesheet';
    };
  });
})();
