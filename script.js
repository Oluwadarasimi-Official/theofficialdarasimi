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
