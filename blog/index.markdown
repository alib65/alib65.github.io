---
layout: default
title: Blog
---

<ul class="post-list">
  {% for post in site.posts %}
    <li>
      <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
      <div class="post-meta">{{ post.date | date: "%B %d, %Y" }}</div>
      <p>{{ post.excerpt }}</p>
    </li>
  {% endfor %}
</ul>
