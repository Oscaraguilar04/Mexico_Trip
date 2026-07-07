(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  const searchForm = document.querySelector('.search-bar');
  const newsletterForm = document.querySelector('.newsletter-form');

  /* Sticky header shadow on scroll */
  function onScroll() {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile navigation */
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      mainNav.classList.toggle('open');
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        mainNav.classList.remove('open');
      });
    });
  }

  /* Smooth scroll offset for fixed header */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* Prevent default form submissions (demo site) */
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
    });
  }

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input) input.value = '';
    });
  }
})();
