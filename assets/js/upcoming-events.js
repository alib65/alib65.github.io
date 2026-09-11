(function () {
  async function loadUpcoming() {
    var container = document.getElementById('upcoming-events');
    var listEl = document.getElementById('upcoming-events-list');
    if (!container || !listEl) return;

    var html;
    try {
      var res = await fetch('performance.html', { cache: 'no-store' });
      html = await res.text();
    } catch (e) {
      return;
    }

    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('li.music-item');
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var events = [];
    items.forEach(function (item) {
      var titleEl = item.querySelector('.piece-title');
      if (!titleEl) return;
      var titleNode = titleEl.childNodes[0];
      var title = titleNode ? titleNode.textContent.trim() : titleEl.textContent.trim();

      var dated = item.querySelectorAll('.performance-list li[data-date]');
      dated.forEach(function (li) {
        var start = new Date(li.getAttribute('data-date'));
        var endAttr = li.getAttribute('data-end');
        var end = endAttr ? new Date(endAttr) : start;
        if (isNaN(start.getTime())) return;
        if (end >= today) {
          events.push({ title: title, text: li.textContent.trim(), sortKey: start });
        }
      });
    });

    events.sort(function (a, b) {
      return a.sortKey - b.sortKey;
    });

    if (events.length === 0) {
      container.hidden = true;
      return;
    }

    listEl.innerHTML = '';
    events.forEach(function (ev) {
      var li = document.createElement('li');
      li.className = 'upcoming-item';

      var title = document.createElement('div');
      title.className = 'upcoming-title';
      title.textContent = ev.title;

      var detail = document.createElement('div');
      detail.className = 'upcoming-detail';
      detail.textContent = ev.text;

      li.appendChild(title);
      li.appendChild(detail);
      listEl.appendChild(li);
    });

    container.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUpcoming);
  } else {
    loadUpcoming();
  }
})();
