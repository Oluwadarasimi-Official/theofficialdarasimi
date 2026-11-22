/* =====================================================================
   Official Darax — Portfolio 2.0
   Modules: theme · nav · reveal · explorer · preview modal
   Plain JS, no dependencies.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORAGE_KEY = 'portfolio-theme';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Theme ---------- */
  var Theme = (function () {
    var btn = $('#themeToggle');
    var meta = $('#themeColor');
    var COLORS = { dark: '#0B0D0F', light: '#F6F3EC' };

    function stored() {
      try { var v = localStorage.getItem(STORAGE_KEY); return v === 'light' || v === 'dark' ? v : null; }
      catch (e) { return null; }
    }
    function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
    function apply(theme) {
      root.setAttribute('data-theme', theme);
      if (meta) meta.setAttribute('content', COLORS[theme]);
      if (btn) btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
    function init() {
      apply(current());
      if (btn) {
        btn.addEventListener('click', function () {
          var next = current() === 'light' ? 'dark' : 'light';
          apply(next);
          try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* storage unavailable */ }
        });
      }
      // Follow the OS setting until the visitor makes an explicit choice.
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: light)');
        var onChange = function (e) { if (!stored()) apply(e.matches ? 'light' : 'dark'); };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
      }
    }
    return { init: init };
  })();

  /* ---------- Navigation ---------- */
  var Nav = (function () {
    var nav = $('#nav');
    var btn = $('#menuBtn');
    var links = $('#navLinks');

    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      links.classList.toggle('is-open', open);
    }
    function init() {
      if (!nav || !btn || !links) return;
      btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
      $all('a', links).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (btn.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target)) setOpen(false);
      });
      window.addEventListener('resize', function () { if (window.innerWidth > 860) setOpen(false); }, { passive: true });

      var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // Highlight the section in view.
      if (!('IntersectionObserver' in window)) return;
      var map = {};
      $all('a[data-section]', links).forEach(function (a) { map[a.getAttribute('data-section')] = a; });
      var sectionFor = { top: 'top', projects: 'projects', explore: 'projects', expertise: 'expertise', about: 'about', contact: 'contact' };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var key = sectionFor[en.target.id];
          Object.keys(map).forEach(function (k) {
            var on = k === key;
            map[k].classList.toggle('is-active', on);
            if (on) map[k].setAttribute('aria-current', 'true'); else map[k].removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(sectionFor).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
    }
    return { init: init };
  })();

  /* ---------- Scroll reveal ---------- */
  var Reveal = (function () {
    function init() {
      var els = $all('.reveal');
      if (reduceMotion || !('IntersectionObserver' in window)) {
        els.forEach(function (el) { el.classList.add('is-visible'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      els.forEach(function (el) { io.observe(el); });
    }
    return { init: init };
  })();

  /* ---------- Project explorer ---------- */
  var Explorer = (function () {
    var input = $('#projectSearch');
    var grid = $('#projectGrid');
    var count = $('#resultCount');
    var active = $('#activeFilters');
    var empty = $('#emptyState');
    var chips = $all('.chip[data-filter]');
    var cards = grid ? $all('.p-card', grid) : [];
    cards.forEach(function (c) {
      var parts = $all('.meta-row, .p-card__title, .p-card__desc, .stack', c).map(function (n) { return n.textContent; });
      parts.push(c.getAttribute('data-search') || '');
      c._text = parts.join(' ').replace(/\s+/g, ' ').toLowerCase();
    });
    var state = { filter: 'all', query: '' };
    var X = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

    function labelFor(filter) {
      var chip = chips.filter(function (c) { return c.getAttribute('data-filter') === filter; })[0];
      return chip ? chip.firstChild.textContent.trim() : filter;
    }
    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    }

    function render() {
      var terms = state.query.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (card) {
        var cats = (card.getAttribute('data-cats') || '').split(' ');
        var text = card._text;
        var ok = (state.filter === 'all' || cats.indexOf(state.filter) !== -1) &&
          terms.every(function (t) { return text.indexOf(t) !== -1; });
        var wasHidden = card.hidden;
        card.hidden = !ok;
        if (ok) {
          shown++;
          if (wasHidden && !reduceMotion) {
            card.classList.remove('is-entering');
            void card.offsetWidth; // restart animation
            card.classList.add('is-entering');
          }
        }
      });

      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-filter') === state.filter)); });

      var total = cards.length;
      count.textContent = shown === total ? 'Showing all ' + total + ' projects'
        : 'Showing ' + shown + ' of ' + total + ' project' + (total === 1 ? '' : 's');

      var pills = [];
      if (state.filter !== 'all') pills.push('<button type="button" class="af-pill" data-clear="filter" aria-label="Remove category filter: ' + escapeHtml(labelFor(state.filter)) + '">' + escapeHtml(labelFor(state.filter)) + X + '</button>');
      if (state.query) pills.push('<button type="button" class="af-pill" data-clear="query" aria-label="Clear search: ' + escapeHtml(state.query) + '">“' + escapeHtml(state.query) + '”' + X + '</button>');
      if (pills.length > 1) pills.push('<button type="button" class="af-clear" data-clear-all>Clear all</button>');
      active.innerHTML = pills.join('');
      active.hidden = pills.length === 0;

      empty.hidden = shown !== 0;
      grid.hidden = shown === 0;
    }

    function clearAll(focusSearch) {
      state.filter = 'all'; state.query = ''; input.value = ''; render();
      if (focusSearch) input.focus();
    }

    function init() {
      if (!grid || !input) return;
      var t;
      input.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { state.query = input.value.trim(); render(); }, 90);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && input.value) { e.stopPropagation(); input.value = ''; state.query = ''; render(); }
      });
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          var f = c.getAttribute('data-filter');
          state.filter = (f === state.filter && f !== 'all') ? 'all' : f;
          render();
        });
      });
      document.addEventListener('click', function (e) {
        var clr = e.target.closest('[data-clear]');
        if (clr) {
          if (clr.getAttribute('data-clear') === 'filter') state.filter = 'all';
          else { state.query = ''; input.value = ''; }
          render();
          input.focus();
          return;
        }
        if (e.target.closest('[data-clear-all]')) clearAll(true);
      });
      // "/" focuses search (when not typing elsewhere).
      document.addEventListener('keydown', function (e) {
        if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (/INPUT|TEXTAREA|SELECT/.test(tag) || document.body.classList.contains('is-locked')) return;
        e.preventDefault();
        input.focus();
      });
      render();
    }
    return { init: init };
  })();

  /* ---------- Preview modal ---------- */
  var Modal = (function () {
    var modal = $('#previewModal');
    if (!modal) return { init: function () {} };
    var dialog = $('.modal__dialog', modal);
    var stage = $('#modalStage');
    var frameWrap = $('#stageFrame');
    var loading = $('#stageLoading');
    var slow = $('#stageSlow');
    var detail = $('#stageDetail');
    var vpToggle = $('#viewportToggle');
    var data = {};
    try { data = JSON.parse($('#projectData').textContent); } catch (e) { data = {}; }

    var lastFocus = null;
    var slowTimer = null;
    var SLOW_MS = 9000;
    var FOCUSABLE = 'a[href]:not([hidden]), button:not([disabled]):not([hidden]), iframe, input, [tabindex]:not([tabindex="-1"])';

    function el(tag, text) { var n = document.createElement(tag); if (text != null) n.textContent = text; return n; }

    function setLink(a, href, label) {
      if (href) { a.href = href; a.hidden = false; } else { a.removeAttribute('href'); a.hidden = true; }
      if (label && a.id === 'modalOpen') $('#modalOpenLabel').textContent = label;
    }

    function fill(p) {
      $('#modalTitle').textContent = p.name;
      var meta = $('#modalMeta'); meta.innerHTML = '';
      var status = el('span'); status.className = 'status status--' + p.statusKey;
      var dot = el('span'); dot.className = 'status__dot'; dot.setAttribute('aria-hidden', 'true');
      status.appendChild(dot); status.appendChild(document.createTextNode(p.status));
      var cat = el('span', p.cats[0]); cat.className = 'cat';
      meta.appendChild(cat); meta.appendChild(status);
      if (p.flag) { var f = el('span', p.flag); f.className = 'flag'; meta.appendChild(f); }

      $('#modalDesc').textContent = p.desc;
      var stackEl = $('#modalStack'); stackEl.innerHTML = '';
      p.stack.forEach(function (s) { stackEl.appendChild(el('li', s)); });
      $('#modalCats').textContent = p.cats.join(' · ');

      var note = $('#modalNote');
      note.innerHTML = '';
      if (p.note) note.appendChild(document.createTextNode(p.note + ' '));
      if (p.ask) {
        var a = el('a', p.ask);
        a.href = 'https://wa.me/2347010168667?text=' + encodeURIComponent('Hello David, I\'d like to get the ' + p.name + ' app.');
        a.target = '_blank'; a.rel = 'noopener';
        note.appendChild(a);
      }
      note.hidden = !note.childNodes.length;

      var href = p.url || p.askUrl;
      var label = p.url ? (p.linkLabel || 'Open in new tab') : 'Request on WhatsApp';
      setLink($('#modalOpen'), href, label);
      $('#detailOpen').href = href; $('#detailOpen').textContent = label;
      $('#slowOpen').href = href || '#';
    }

    function showDetail(p, reason) {
      stage.classList.add('is-detail');
      stage.classList.remove('is-mobile');
      frameWrap.hidden = true;
      detail.hidden = false;
      vpToggle.hidden = true;
      $('#detailMono').textContent = p.name.replace(/[^A-Za-zỌọ0-9]/g, '').slice(0, 2);
      $('#detailReason').textContent = reason;
    }

    function showFrame(p) {
      stage.classList.remove('is-detail');
      frameWrap.hidden = false;
      detail.hidden = true;
      vpToggle.hidden = false;
      setViewport('desktop');
      loading.classList.remove('is-done');
      slow.hidden = true;

      var iframe = document.createElement('iframe');
      iframe.title = 'Live preview of ' + p.name;
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
      iframe.setAttribute('allow', 'clipboard-write');
      iframe.addEventListener('load', function () {
        loading.classList.add('is-done');
        clearTimeout(slowTimer);
      });
      clearTimeout(slowTimer);
      slowTimer = setTimeout(function () {
        if (!loading.classList.contains('is-done')) slow.hidden = false;
      }, SLOW_MS);
      iframe.src = p.url;
      frameWrap.appendChild(iframe);
    }

    function teardownFrame() {
      clearTimeout(slowTimer);
      var f = $('iframe', frameWrap);
      if (f) { f.src = 'about:blank'; f.remove(); }
    }

    function setViewport(vp) {
      stage.classList.toggle('is-mobile', vp === 'mobile');
      $all('button', vpToggle).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-vp') === vp)); });
    }

    function focusables() {
      return $all(FOCUSABLE, dialog).filter(function (n) { return n.offsetParent !== null || n.tagName === 'IFRAME'; });
    }

    function open(id, mode, trigger) {
      var p = data[id];
      if (!p) return;
      lastFocus = trigger || document.activeElement;
      teardownFrame();
      fill(p);
      if (mode === 'preview' && p.embed === 'ok' && p.url) {
        showFrame(p);
      } else if (p.embed === 'blocked') {
        showDetail(p, p.name + ' can’t be previewed inside this page — the site blocks embedding for security. Open it in a new tab to explore it fully.');
      } else if (!p.url) {
        showDetail(p, p.name + ' is an Android app without a public website, so there is no live preview. ' + (p.ask || ''));
      } else {
        showDetail(p, 'Open ' + p.name + ' in a new tab to explore the live site.');
      }
      modal.hidden = false;
      modal.classList.remove('is-closing');
      document.body.classList.add('is-locked');
      $all('body > *:not(.modal):not(script)').forEach(function (n) { n.setAttribute('inert', ''); });
      requestAnimationFrame(function () { var c = $('[data-close].icon-btn', dialog); (c || dialog).focus(); });
    }

    function close() {
      if (modal.hidden) return;
      var finish = function () {
        modal.hidden = true;
        modal.classList.remove('is-closing');
        teardownFrame();
      };
      $all('body > [inert]').forEach(function (n) { n.removeAttribute('inert'); });
      document.body.classList.remove('is-locked');
      if (reduceMotion) finish();
      else { modal.classList.add('is-closing'); setTimeout(finish, 190); }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function onKey(e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function init() {
      document.addEventListener('click', function (e) {
        var t = e.target.closest('[data-open]');
        if (t) { e.preventDefault(); open(t.getAttribute('data-open'), t.getAttribute('data-mode'), t); return; }
        if (e.target.closest('[data-close]') && modal.contains(e.target)) close();
      });
      $all('button', vpToggle).forEach(function (b) {
        b.addEventListener('click', function () { setViewport(b.getAttribute('data-vp')); });
      });
      document.addEventListener('keydown', onKey);
    }
    return { init: init, open: open, close: close };
  })();

  Theme.init();
  Nav.init();
  Reveal.init();
  Explorer.init();
  Modal.init();
})();
