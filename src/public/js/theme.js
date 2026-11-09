(function () {
  var t = 'light';
  try {
    t = localStorage.getItem('mm-tema') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
})();
