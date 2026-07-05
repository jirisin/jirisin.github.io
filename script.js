document.addEventListener('DOMContentLoaded', function () {
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (!els.length) return;

  els.forEach(function (el, i) {
    var siblings = Array.prototype.slice.call(el.parentNode.querySelectorAll(':scope > [data-reveal]'));
    var idx = Math.max(0, siblings.indexOf(el));
    var delay = el.getAttribute('data-reveal-delay');
    el.style.transitionDelay = (delay != null ? parseInt(delay, 10) : idx * 80) + 'ms';
  });

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

  els.forEach(function (el) { observer.observe(el); });

  var carousel = document.getElementById('case-carousel');
  var prevBtn = document.getElementById('carousel-prev');
  var nextBtn = document.getElementById('carousel-next');
  if (!carousel || !prevBtn || !nextBtn) return;

  var wrap = carousel.closest('.carousel-wrap');
  var cards = Array.prototype.slice.call(carousel.querySelectorAll('.case-card'));

  // Fixed step (card width + gap) — how many cards fit on screen at once is
  // left up to the viewport; each click just shifts the strip by exactly
  // one card, however many are currently in or out of view.
  var step = function () {
    if (!cards.length) return 384;
    var gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  };

  var updateButtons = function () {
    var maxScroll = wrap.scrollWidth - wrap.clientWidth - 1;
    prevBtn.disabled = wrap.scrollLeft <= 0;
    nextBtn.disabled = wrap.scrollLeft >= maxScroll;
  };

  prevBtn.addEventListener('click', function () { wrap.scrollBy({ left: -step(), behavior: 'smooth' }); });
  nextBtn.addEventListener('click', function () { wrap.scrollBy({ left: step(), behavior: 'smooth' }); });
  wrap.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
});
