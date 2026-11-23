(function () {
  var hdr = document.getElementById('hdr');
  function onScroll() { hdr.classList.toggle('solid', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar = document.getElementById('progress');
  var topBtn = document.getElementById('top-btn');
  var bandImg = document.querySelector('.band img.bg');
  if (!bar || !topBtn) return;
  var ticking = false;
  function frame() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    topBtn.classList.toggle('show', window.scrollY > 900);
    if (bandImg && !reduce) {
      var r = bandImg.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var t = (r.top + r.height / 2 - window.innerHeight / 2) * -0.08;
        bandImg.style.transform = 'scale(1.16) translateY(' + t.toFixed(1) + 'px)';
      }
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();
  topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  function countUp(el) {
    var to = +el.getAttribute('data-to'), suffix = el.getAttribute('data-suffix') || '', start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / 1400, 1);
      el.firstChild.nodeValue = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && !reduce) {
    var sel = '.intro > div, .ticker, .panel, .stat, .head > *, .card, .fine, .approach > div:first-child, .row, .band .wrap > *, .quote > div, form, .foot > div, .legal, .svc, .post-card, .faq details, .prose > *, .two > div, .value';
    var els = [].slice.call(document.querySelectorAll(sel));
    els.forEach(function (el) {
      var sibs = [].slice.call(el.parentElement.children);
      el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 0.09 + 's');
      el.classList.add('rv');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        el.classList.add('in');
        var b = el.querySelector && el.matches('.stat') ? el.querySelector('b[data-to]') : null;
        if (b) countUp(b);
        setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--d'); }, 1400);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  var form = document.getElementById('estimate-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('sent').hidden = false;
  });

  var menuBtn = document.getElementById('menu-btn');
  var mnav = document.getElementById('mnav');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mnav.hidden = !open;
  }
  menuBtn.addEventListener('click', function () { setMenu(mnav.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) setMenu(false); });

  var filters = document.querySelectorAll('[data-filter]');
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      filters.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('[data-cat]').forEach(function (c) {
        c.hidden = !(f === 'all' || c.getAttribute('data-cat') === f);
      });
    });
  });
})();
