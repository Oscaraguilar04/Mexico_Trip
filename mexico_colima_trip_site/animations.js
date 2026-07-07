(function () {
  'use strict';

  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach(function (el) { observer.observe(el); });

  /* Subtle parallax on hero images */
  const heroMain = document.querySelector('.hero-img-main');
  const heroAccent = document.querySelector('.hero-img-accent');

  if (heroMain || heroAccent) {
    window.addEventListener('scroll', function () {
      const y = window.scrollY * 0.04;
      if (heroMain) heroMain.style.transform = 'translateY(' + y + 'px)';
      if (heroAccent) heroAccent.style.transform = 'translateY(' + (-y * 0.6) + 'px)';
    }, { passive: true });
  }
})();
