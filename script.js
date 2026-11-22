// Reveal on scroll
(function(){
  var els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){
    els.forEach(function(e){ e.classList.add('visible'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        en.target.classList.add('visible');
        io.unobserve(en.target);
      }
    });
  }, {threshold:.12});
  els.forEach(function(e){ io.observe(e); });
})();

// Mobile menu
(function(){
  var btn = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  btn.addEventListener('click', function(){
    btn.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      btn.classList.remove('open');
      links.classList.remove('open');
    });
  });
})();

// Light / dark theme toggle (persisted)
(function(){
  var root = document.documentElement;
  var btn = document.getElementById('themeToggle');
  if(!btn) return;
  var saved = null;
  try{ saved = localStorage.getItem('portfolio-theme'); }catch(e){}
  if(saved === 'light' || saved === 'dark'){ root.setAttribute('data-theme', saved); }
  btn.addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try{ localStorage.setItem('portfolio-theme', next); }catch(e){}
  });
})();

// Nav shadow on scroll
(function(){
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function(){
    nav.style.boxShadow = window.scrollY > 10 ? '0 8px 30px rgba(0,0,0,.45)' : 'none';
  }, {passive:true});
})();

// Project preview modal (live site in an iframe, loaded only on click)
(function(){
  var modal = document.getElementById('pvModal');
  if(!modal) return;
  var dialog = modal.querySelector('.pv-dialog');
  var stage = document.getElementById('pvStage');
  var loading = document.getElementById('pvLoading');
  var slow = document.getElementById('pvSlow');
  var detail = document.getElementById('pvDetail');
  var title = document.getElementById('pvTitle');
  var openBtn = document.getElementById('pvOpen');
  var WA = 'https://wa.me/2347010168667?text=';
  // Sites that refuse to be embedded (X-Frame-Options / frame-ancestors), checked 2026-11-22
  var BLOCKED = ['nexorabydavy.vercel.app','nova-exam-hub.base44.app','opera-metric-core.base44.app','ultraneatcomputercenter.vercel.app','hustlyapp.vercel.app','t.me'];
  var frame = null, timer = null, lastFocus = null, scrollY = 0;

  function host(u){ try{ return new URL(u).hostname; }catch(e){ return ''; } }
  function setOpen(href, label){
    [openBtn, document.getElementById('pvDetailOpen'), document.getElementById('pvSlowOpen')].forEach(function(a){
      a.href = href; a.textContent = label;
    });
  }
  function teardown(){
    clearTimeout(timer); timer = null;
    if(frame){ frame.src = 'about:blank'; frame.remove(); frame = null; }
  }
  function showDetail(card, reason){
    var tags = document.getElementById('pvTags'); tags.innerHTML = '';
    var src = card.querySelector('.card-tags');
    if(src) tags.innerHTML = src.innerHTML;
    var p = card.querySelector('.card-body > p');
    document.getElementById('pvDesc').textContent = p ? p.textContent : '';
    document.getElementById('pvReason').textContent = reason;
    loading.hidden = true; slow.hidden = true; detail.hidden = false;
  }
  function showFrame(url, name){
    detail.hidden = true; slow.hidden = true; loading.hidden = false;
    frame = document.createElement('iframe');
    frame.className = 'pv-frame';
    frame.title = 'Live preview of ' + name;
    frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
    frame.setAttribute('loading','eager');
    frame.setAttribute('tabindex','-1'); // keep keyboard focus (and Esc) inside the dialog
    frame.addEventListener('load', function(){
      if(!frame || frame.src === 'about:blank') return;
      clearTimeout(timer); loading.hidden = true; slow.hidden = true;
      frame.classList.add('ready');
    });
    frame.src = url;
    stage.appendChild(frame);
    timer = setTimeout(function(){ loading.hidden = true; slow.hidden = false; }, 9000);
  }
  function focusables(){
    return Array.prototype.filter.call(dialog.querySelectorAll('a[href],button,[tabindex]:not([tabindex="-1"])'), function(el){
      return el.offsetParent !== null || el === document.activeElement;
    });
  }
  function open(card, trigger){
    var link = card.querySelector('.card-link');
    var url = link ? link.href : '';
    var name = (card.querySelector('h3') || {}).textContent || 'Project';
    lastFocus = trigger;
    title.textContent = name;
    teardown();
    if(!url){
      var ask = WA + encodeURIComponent('Hello David, I saw ' + name + ' on your portfolio and I would like to get the APK.');
      setOpen(ask, 'Message me to get the APK');
      showDetail(card, name + ' is an Android app (APK) without a public website, so there is no live preview. Message me on WhatsApp to get it.');
    } else if(BLOCKED.indexOf(host(url)) !== -1){
      setOpen(url, 'Open in New Tab');
      showDetail(card, name + ' can\u2019t be previewed inside this page \u2014 the site blocks embedding for security. Open it in a new tab to explore it fully.');
    } else {
      setOpen(url, 'Open in New Tab');
      showFrame(url, name);
    }
    scrollY = window.scrollY;
    document.body.style.top = (-scrollY) + 'px';
    document.body.classList.add('pv-locked');
    modal.hidden = false;
    requestAnimationFrame(function(){ modal.classList.add('show'); modal.querySelector('.pv-close').focus(); });
  }
  function close(){
    if(modal.hidden) return;
    modal.classList.remove('show');
    modal.hidden = true;
    teardown();
    document.body.classList.remove('pv-locked');
    document.body.style.top = '';
    window.scrollTo({top: scrollY, left: 0, behavior: 'instant'});
    if(lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
  }

  // Add a Preview button to every project card
  document.querySelectorAll('.work-grid .card').forEach(function(card){
    var body = card.querySelector('.card-body');
    var link = card.querySelector('.card-link');
    var actions = document.createElement('div');
    actions.className = 'card-actions';
    if(link) actions.appendChild(link);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-preview';
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>Preview';
    btn.setAttribute('aria-label', 'Preview ' + ((card.querySelector('h3')||{}).textContent || 'project'));
    btn.addEventListener('click', function(){ open(card, btn); });
    actions.appendChild(btn);
    body.appendChild(actions);
  });

  modal.addEventListener('click', function(e){ if(e.target.closest('[data-pv-close]')) close(); });
  document.addEventListener('keydown', function(e){
    if(modal.hidden) return;
    if(e.key === 'Escape'){ e.preventDefault(); close(); return; }
    if(e.key !== 'Tab') return;
    var f = focusables(); if(!f.length) return;
    var first = f[0], last = f[f.length-1];
    if(!dialog.contains(document.activeElement)){ e.preventDefault(); first.focus(); return; }
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
})();
