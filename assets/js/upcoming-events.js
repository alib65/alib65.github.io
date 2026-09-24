(function () {
  function setSectionTitle(container, count, singular, plural) {
    var titleEl = container.querySelector('.section-title');
    if (!titleEl) return;
    titleEl.textContent = count === 1 ? singular : plural;
  }

  async function loadUpcoming(sourceFile, containerId, listId, singular, plural) {
    var container = document.getElementById(containerId);
    var listEl = document.getElementById(listId);
    if (!container || !listEl) return;

    var html;
    try {
      var res = await fetch(sourceFile, { cache: 'no-store' });
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
          events.push({ title: title, html: li.innerHTML.trim(), sortKey: start });
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
      detail.innerHTML = ev.html;

      li.appendChild(title);
      li.appendChild(detail);
      listEl.appendChild(li);
    });

    setSectionTitle(container, events.length, singular, plural);
    container.hidden = false;
  }

  async function loadUpcomingArticles(sourceFile, containerId, listId, singular, plural) {
    var container = document.getElementById(containerId);
    var listEl = document.getElementById(listId);
    if (!container || !listEl) return;

    var html;
    try {
      var res = await fetch(sourceFile, { cache: 'no-store' });
      html = await res.text();
    } catch (e) {
      return;
    }

    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.article-item');
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var events = [];
    items.forEach(function (item) {
      var titleEl = item.querySelector('.article-title');
      var metaEl = item.querySelector('.article-meta[data-date]');
      if (!titleEl || !metaEl) return;

      var start = new Date(metaEl.getAttribute('data-date'));
      if (isNaN(start.getTime())) return;
      if (start >= today) {
        events.push({ title: titleEl.textContent.trim(), html: metaEl.innerHTML.trim(), sortKey: start });
      }
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
      detail.innerHTML = ev.html;

      li.appendChild(title);
      li.appendChild(detail);
      listEl.appendChild(li);
    });

    setSectionTitle(container, events.length, singular, plural);
    container.hidden = false;
  }

  function loadAll() {
    loadUpcoming('performance.html', 'upcoming-events', 'upcoming-events-list', 'Upcoming Performance', 'Upcoming Performances');
    loadUpcomingArticles('articles.html', 'upcoming-article', 'upcoming-article-list', 'Forthcoming Journal Article', 'Forthcoming Journal Articles');
    loadUpcoming('conferences.html', 'upcoming-conference', 'upcoming-conference-list', 'Upcoming Conference Presentation', 'Upcoming Conference Presentations');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAll);
  } else {
    loadAll();
  }
})();
