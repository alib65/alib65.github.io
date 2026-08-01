# Ali Balighi — portfolio website

This repository contains the source for [alibalighi.com](https://alibalighi.com/), a static portfolio published with GitHub Pages.

## Structure

- `index.html` — homepage and WebGL background animation
- `about.html` — biography and press-ready bios
- `music.html` — compositions and performances grouped by year
- `scores.html` — published score links
- `articles.html` — research and publications
- `books.html` — poetry and books
- `news.html` — press and announcements grouped by year
- `contact.html` — contact information
- `assets/css/site.css` — shared site styles
- `assets/js/home-animation.js` — homepage animation and controls
- `feed.xml` and `feed.json` — news feeds
- `sitemap.xml` and `robots.txt` — search-engine discovery
- `404.html` — custom not-found page

## Local preview

From the repository root, run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. A local server is recommended because browser security policies can differ when HTML files are opened directly from disk.

## Updating the site

1. Edit the relevant HTML page.
2. Keep the primary and external navigation consistent across pages.
3. When adding News items, update both feeds and the page's visible year section.
4. Add or remove public pages in `sitemap.xml` and use an accurate `lastmod` date.
5. Validate local links, HTML, XML, and JSON before publishing.

The canonical public hostname is `https://alibalighi.com/`. The blog is hosted separately at `https://blog.alibalighi.com/` and should maintain its own sitemap.
