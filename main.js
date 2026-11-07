/* ayazulhaq.com v2 shared behaviour: theme toggle, mobile menu, copy email, one-time reveal, year. */
(function () {
  const root = document.documentElement;

  const stored = (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
  if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);

  function currentTheme() {
    const explicit = root.getAttribute('data-theme');
    if (explicit) return explicit;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  const menu = document.querySelector('[data-menu-toggle]');
  const links = document.querySelector('.nav-links');
  if (menu && links) {
    menu.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && links.classList.contains('is-open')) { links.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); } });
  }

  document.querySelectorAll('[data-copy-email]').forEach(button => {
    const email = button.getAttribute('data-copy-email');
    const label = button.innerHTML;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(email);
        button.textContent = 'Copied';
        setTimeout(() => { button.innerHTML = label; }, 1600);
      } catch (e) { location.href = 'mailto:' + email; }
    });
  });

  let seen = false;
  try { seen = sessionStorage.getItem('revealed') === '1'; } catch (e) {}
  if (!seen) { root.setAttribute('data-reveal', ''); try { sessionStorage.setItem('revealed', '1'); } catch (e) {} }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  const img = document.querySelector('img.portrait');
  if (img) img.addEventListener('error', () => { const f = document.createElement('div'); f.className = 'portrait-fallback'; f.textContent = 'AH'; img.replaceWith(f); });
})();
