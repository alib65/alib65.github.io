(function () {
  function closeAll(except) {
    document.querySelectorAll('.nav-group-toggle').forEach(function (cb) {
      if (cb !== except) cb.checked = false;
    });
  }

  document.querySelectorAll('.nav-group-toggle').forEach(function (cb) {
    cb.addEventListener('change', function () {
      if (cb.checked) closeAll(cb);
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-group')) closeAll(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll(null);
  });
})();
