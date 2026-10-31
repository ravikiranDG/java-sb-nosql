'use strict';

const chapters = window.TRACKS.flatMap(track => track.topics.map(([id, title, keywords], index) => ({
  file: `${track.id}/${id}.md`, title, keywords, track: track.title, number: index + 1
})));
const byFile = new Map(chapters.map(chapter => [chapter.file, chapter]));
const interviewQuestionCount = window.TRACKS.reduce((sum, track) => sum + track.interviewQuestions, 0);
const documents = new Map();
let activeFile = null;
let routeVersion = 0;
let searchVersion = 0;
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function readSetting(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; }
  catch (error) {
    console.warn('Browser storage is unavailable.', error);
    $('#announcement').textContent = 'Browser storage is unavailable. Reading works, but progress and theme cannot be saved.';
    return fallback;
  }
}

function saveSetting(key, value) {
  try { localStorage.setItem(key, value); }
  catch (error) {
    console.warn('Could not save reading preferences.', error);
    $('#announcement').textContent = 'Could not save preferences. Your progress will not persist after reloading.';
  }
}

let reviewed;
try {
  const saved = JSON.parse(readSetting('backend-prep-reviewed', '[]'));
  if (!Array.isArray(saved) || !saved.every(file => typeof file === 'string')) throw new Error('Invalid progress data');
  reviewed = new Set(saved.filter(file => byFile.has(file)));
} catch (error) {
  console.warn('Stored progress could not be read.', error);
  $('#announcement').textContent = 'Stored progress could not be read. Progress has been reset for this visit.';
  reviewed = new Set();
}

function setTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('#theme-toggle').textContent = dark ? 'Light theme' : 'Dark theme';
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
}

function buildHome() {
  $('#home').innerHTML = `
    <div class="hero">
      <div class="eyebrow">The backend interview field guide</div>
      <h1>Don't just know the answer.<br><span>Understand the why.</span></h1>
      <p>Java, Spring Boot, and MongoDB essentials explained like a teammate would explain them:
      must-know concepts, interview questions with model answers, runnable implementations,
      and the follow-up questions that reveal real understanding.</p>
      <div class="pill-row"><span class="pill">3 learning tracks</span>
      <span class="pill">${chapters.length} focused chapters</span>
      <span class="pill">${interviewQuestionCount} interview questions + answers</span>
      <span class="pill">${chapters.length * 3} answered self-checks</span></div>
    </div>
    <section class="path"><h2>Start with the interview question banks</h2>
      <p>Practice an answer aloud, trace the example, identify the trap, and attempt the follow-up.
      Use the linked implementation chapters when you need to write the code, not just name the concept.</p>
      <ul>${window.TRACKS.map(track => `<li><a href="#${track.id}/interview-questions.md">
        ${track.title}: ${track.interviewQuestions} essential interview questions and model answers</a></li>`).join('')}</ul>
      <p>New implementation drills:
      <a href="#java/ordering.md">Comparable versus Comparator</a> and
      <a href="#java/custom-exceptions.md">custom exceptions with Spring error handling</a>.</p>
    </section>
    <section class="path"><h2>A practical study path</h2>
      <p>Start with <a href="#java/equality.md">equality</a>, then <a href="#java/memory.md">memory</a>
      and <a href="#java/collections.md">collections</a>. Move to
      <a href="#spring-boot/container.md">dependency injection</a> and
      <a href="#spring-boot/transactions.md">transactions</a>. Finish with
      <a href="#mongodb/modeling.md">document modeling</a> and
      <a href="#mongodb/indexes.md">indexes</a>. For each topic: explain it aloud, trace the example,
      then answer the self-checks before revealing their answers.</p></section>
    ${window.TRACKS.map(track => `<section class="track">
      <div class="track-header"><h2>${track.title}</h2><span>${track.subtitle}</span></div>
      <p>${track.description}</p><div class="topic-grid">
      ${chapters.filter(chapter => chapter.track === track.title).map(chapter => `
        <a class="topic-card" href="#${chapter.file}">
          <span class="number">${String(chapter.number).padStart(2, '0')} / ${chapter.track}</span>
          <h3>${escapeHtml(chapter.title)}</h3><p>${escapeHtml(chapter.keywords)}</p>
        </a>`).join('')}</div></section>`).join('')}`;
}

function buildNavigation(matches = null) {
  $('#navigation').innerHTML = window.TRACKS.map(track => {
    const items = chapters.filter(chapter => chapter.track === track.title && (!matches || matches.has(chapter.file)));
    if (!items.length) return '';
    return `<details class="nav-group" open><summary>${track.title} <small>(${items.length})</small></summary>
      ${items.map(chapter => `<a href="#${chapter.file}" class="nav-link${reviewed.has(chapter.file) ? ' reviewed' : ''}"
        ${activeFile === chapter.file ? 'aria-current="page"' : ''}>
        ${escapeHtml(chapter.title)}</a>`).join('')}</details>`;
  }).join('');
  $('#study-progress').textContent = `${reviewed.size} / ${chapters.length} chapters reviewed`;
}

function fetchDocument(file) {
  if (!documents.has(file)) {
    const request = fetch(file).then(response => {
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
      return response.text();
    }).catch(error => {
      documents.delete(file);
      throw error;
    });
    documents.set(file, request);
  }
  return documents.get(file);
}

function toggleMenu(open) {
  $('#sidebar').classList.toggle('open', open);
  $('#overlay').hidden = !open;
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
}

function resolveChapterLink(href, file) {
  if (href.startsWith('#')) return `#${file}@${href.slice(1)}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return null;
  const url = new URL(href, new URL(file, location.href.split('#')[0]));
  const base = new URL('.', location.href);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
  const target = decodeURIComponent(url.pathname.slice(base.pathname.length));
  return byFile.has(target) ? `#${target}${url.hash ? `@${url.hash.slice(1)}` : ''}` : null;
}

function decorateArticle(file) {
  const used = new Map();
  const headings = [...$('#article').querySelectorAll('h2, h3')];
  for (const heading of headings) {
    const slug = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    const count = used.get(slug) || 0;
    used.set(slug, count + 1);
    heading.id = count ? `${slug}-${count}` : slug;
  }
  $('#page-toc').innerHTML = headings.filter(heading => heading.tagName === 'H2')
    .map(heading => `<a href="#${file}@${heading.id}">${escapeHtml(heading.textContent)}</a>`).join('');
  $('#article').querySelectorAll('a[href]').forEach(link => {
    const target = resolveChapterLink(link.getAttribute('href'), file);
    if (target) link.setAttribute('href', target);
  });
  $('#article').querySelectorAll('table').forEach(table => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrap';
    table.replaceWith(wrapper);
    wrapper.append(table);
  });
  $('#article').querySelectorAll('pre').forEach(pre => {
    const button = document.createElement('button');
    button.className = 'copy-code';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code example');
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.querySelector('code').textContent);
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = 'Copy'; }, 1500);
      } catch (error) {
        console.warn('Clipboard copy failed.', error);
        $('#announcement').textContent = 'Copy is unavailable in this browser. Select the code and copy it manually.';
      }
    });
    pre.append(button);
  });
}

async function route() {
  const version = ++routeVersion;
  let routeText;
  try { routeText = decodeURIComponent(location.hash.slice(1)); }
  catch { routeText = '__invalid__'; }
  if (routeText === 'main') {
    $('#main').focus();
    return;
  }
  const [file, anchor] = routeText.split('@');
  toggleMenu(false);
  if (!file) {
    activeFile = null;
    $('#home').hidden = false;
    $('#reader').hidden = true;
    document.title = 'Java / Spring Boot / NoSQL - Interview Prep';
    await searchTopics();
    window.scrollTo(0, 0);
    return;
  }
  const chapter = byFile.get(file);
  $('#home').hidden = true;
  $('#reader').hidden = false;
  if (!chapter) {
    activeFile = null;
    $('#chapter-meta').textContent = 'Unknown chapter';
    $('#article').innerHTML = '<h1>Topic not found</h1><p>Choose a chapter from the sidebar or <a href="#">return to all topics</a>.</p>';
    $('#page-toc').innerHTML = '';
    $('#chapter-pagination').innerHTML = '';
    $('#complete').disabled = true;
    await searchTopics();
    return;
  }
  const sameChapter = activeFile === file;
  activeFile = file;
  $('#complete').disabled = true;
  $('#complete').checked = reviewed.has(file);
  $('#chapter-meta').textContent = `${chapter.track} / Chapter ${String(chapter.number).padStart(2, '0')}`;
  document.title = `${chapter.title} - Backend Interview Prep`;
  $('#article').setAttribute('aria-busy', 'true');
  if (!sameChapter) {
    $('#article').textContent = 'Loading chapter...';
    $('#page-toc').innerHTML = '';
    $('#chapter-pagination').innerHTML = '';
  }
  try {
    const markdown = await fetchDocument(file);
    if (version !== routeVersion) return;
    $('#article').innerHTML = DOMPurify.sanitize(marked.parse(markdown));
    decorateArticle(file);
    const index = chapters.indexOf(chapter);
    $('#chapter-pagination').innerHTML = [
      index > 0 ? `<a href="#${chapters[index - 1].file}">&larr; ${escapeHtml(chapters[index - 1].title)}</a>` : '<span></span>',
      index < chapters.length - 1 ? `<a href="#${chapters[index + 1].file}">${escapeHtml(chapters[index + 1].title)} &rarr;</a>` : ''
    ].join('');
    $('#complete').disabled = false;
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
    else if (!sameChapter) {
      window.scrollTo(0, 0);
      $('#main').focus({ preventScroll: true });
    }
  } catch (error) {
    if (version !== routeVersion) return;
    console.error('Chapter loading failed.', error);
    $('#article').innerHTML = `<h1>Could not load this chapter</h1><p>${escapeHtml(error.message)}</p>
      <button id="retry">Try again</button>`;
    $('#retry').addEventListener('click', route);
  } finally {
    if (version === routeVersion) $('#article').removeAttribute('aria-busy');
  }
  await searchTopics();
  updateReadingProgress();
}

async function searchTopics() {
  const version = ++searchVersion;
  const query = $('#search').value.trim().toLowerCase();
  if (!query) {
    $('#search-status').textContent = '';
    buildNavigation();
    return;
  }
  $('#search-status').textContent = 'Searching chapters...';
  const words = query.split(/\s+/);
  const results = await Promise.all(chapters.map(async chapter => {
    try {
      const body = await fetchDocument(chapter.file);
      return { file: chapter.file, text: `${chapter.title} ${chapter.keywords} ${chapter.track} ${body}`.toLowerCase() };
    } catch (error) {
      console.error('Search could not load a chapter.', error);
      return { file: chapter.file, text: `${chapter.title} ${chapter.keywords} ${chapter.track}`.toLowerCase(), failed: true };
    }
  }));
  if (version !== searchVersion) return;
  const matches = new Set(results.filter(result => words.every(word => result.text.includes(word))).map(result => result.file));
  buildNavigation(matches);
  const failures = results.filter(result => result.failed).length;
  $('#search-status').textContent = `${matches.size} matching chapter${matches.size === 1 ? '' : 's'}${failures ? `; ${failures} chapter(s) unavailable for full-text search` : ''}`;
}

function updateReadingProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  $('#reading-progress').style.width = `${available > 0 ? Math.min(100, window.scrollY / available * 100) : 0}%`;
}

setTheme(readSetting('backend-prep-theme', 'dark'));
buildHome();
buildNavigation();
$('#search').addEventListener('input', searchTopics);
$('#menu-toggle').addEventListener('click', () => toggleMenu(!$('#sidebar').classList.contains('open')));
$('#overlay').addEventListener('click', () => { toggleMenu(false); $('#menu-toggle').focus(); });
$('#theme-toggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  saveSetting('backend-prep-theme', theme);
});
$('#complete').addEventListener('change', () => {
  if (!activeFile) return;
  if ($('#complete').checked) reviewed.add(activeFile);
  else reviewed.delete(activeFile);
  saveSetting('backend-prep-reviewed', JSON.stringify([...reviewed]));
  searchTopics();
});
document.addEventListener('keydown', event => {
  const editing = event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]');
  if (event.key === '/' && !editing) {
    event.preventDefault();
    if (matchMedia('(max-width: 760px)').matches) toggleMenu(true);
    $('#search').focus();
  }
  if (event.key === 'Escape') { toggleMenu(false); $('#menu-toggle').focus(); }
});
window.addEventListener('hashchange', route);
window.addEventListener('scroll', updateReadingProgress, { passive: true });
window.addEventListener('resize', updateReadingProgress);
route();
