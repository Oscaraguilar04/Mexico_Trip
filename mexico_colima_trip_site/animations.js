(function () {
  'use strict';

  /* Load curated photos first */
  if (window.TripPhotos) {
    TripPhotos.applyPhotos();
  }

  /* Scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  }

  /* Touch & press animation for images */
  document.querySelectorAll('.img-touch').forEach(function (wrap) {
    var active = false;

    function press() {
      if (active) return;
      active = true;
      wrap.classList.add('is-touched');
    }

    function release() {
      active = false;
      wrap.classList.remove('is-touched');
    }

    function ripple(clientX, clientY) {
      var rect = wrap.getBoundingClientRect();
      var dot = document.createElement('span');
      dot.className = 'touch-ripple';
      dot.style.left = (clientX - rect.left) + 'px';
      dot.style.top = (clientY - rect.top) + 'px';
      wrap.appendChild(dot);
      dot.addEventListener('animationend', function () { dot.remove(); });
    }

    wrap.addEventListener('touchstart', function (e) {
      press();
      if (e.touches && e.touches[0]) {
        ripple(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    wrap.addEventListener('touchend', release, { passive: true });
    wrap.addEventListener('touchcancel', release, { passive: true });

    wrap.addEventListener('mousedown', function (e) {
      press();
      ripple(e.clientX, e.clientY);
    });

    wrap.addEventListener('mouseup', release);
    wrap.addEventListener('mouseleave', release);
  });

  /* Subtle parallax on hero — desktop only */
  if (window.matchMedia('(min-width: 769px)').matches) {
    var heroMain = document.querySelector('.hero-img-main-wrap');
    var heroAccent = document.querySelector('.hero-img-accent-wrap');

    if (heroMain || heroAccent) {
      window.addEventListener('scroll', function () {
        var y = window.scrollY * 0.035;
        if (heroMain) heroMain.style.transform = 'translateY(' + y + 'px)';
        if (heroAccent) heroAccent.style.transform = 'translateY(' + (-y * 0.5) + 'px)';
      }, { passive: true });
    }
  }
})();
