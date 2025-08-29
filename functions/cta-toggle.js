/**
 * cta-toggle.js
 * - Active visuellement le dernier bouton cliqué (primary/ghost)
 * - Affiche uniquement la section ciblée (#contact ou #rdv)
 * - Fait défiler la page en douceur avec compensation d’un header sticky
 * - Gère le hash (#contact / #rdv), y compris au chargement initial
 *
 * Prérequis HTML :
 *   <div id="cta-buttons">
 *     <a class="btn primary" data-target="contact" href="#contact">Écrivez-moi</a>
 *     <a class="btn ghost"   data-target="rdv"     href="#rdv">Prendre rendez-vous</a>
 *   </div>
 *   <section id="contact" hidden>...</section>
 *   <section id="rdv" hidden>...</section>
 *
 * Recommandations CSS :
 *   html { scroll-behavior: smooth; } // pour le scroll doux natif
 *   .is-hidden { display: none; }     // en complément de [hidden] si besoin
 */

(function () {
  // ====== Configuration (adapte au besoin) ======
  const SELECTORS = {
    header: '#header',          // header sticky
    buttonsWrap: '#cta-buttons',
    button: 'a.btn',            // tous les liens-boutons dans le wrap
    contact: '#contact',
    rdv: '#rdv'
  };
  const STORAGE_KEY = 'ctaActiveIndex';
  const SCROLL_EXTRA_OFFSET = 8; // padding visuel supplémentaire (px)
  const VALID_TARGETS = new Set(['contact', 'rdv']);

  // ====== Utilitaires ======
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function getHeaderHeight() {
    const header = qs(SELECTORS.header);
    return header ? header.offsetHeight : 0;
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.toggleAttribute('hidden', hidden);
    el.classList.toggle('is-hidden', hidden); // utile si tu veux forcer display:none
    el.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }

  function showOnly(sectionId) {
    const contact = qs(SELECTORS.contact);
    const rdv     = qs(SELECTORS.rdv);

    // Tout masquer d'abord
    [contact, rdv].forEach(el => setHidden(el, true));

    // Afficher la section demandée
    if (sectionId === 'contact' && contact) setHidden(contact, false);
    if (sectionId === 'rdv'     && rdv)     setHidden(rdv, false);
  }

  function scrollToSection(sectionId, replaceUrlHash = true) {
    const section = qs(sectionId === 'contact' ? SELECTORS.contact :
                       sectionId === 'rdv'     ? SELECTORS.rdv : null);
    if (!section) return;

    const headerH = getHeaderHeight();
    const rectTop = section.getBoundingClientRect().top;
    const y = rectTop + window.pageYOffset - headerH - SCROLL_EXTRA_OFFSET;

    // Focus accessible sans saut
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });

    // Scroll doux compensé
    window.scrollTo({ top: y, behavior: 'smooth' });

    // Gérer le hash dans l’URL (utile pour partage / retour arrière)
    const newHash = `#${sectionId}`;
    if (replaceUrlHash) {
      // Choix : pushState (garde historique) ou replaceState (ne le pollue pas)
      // Ici on utilise pushState pour que "retour" ramène au scroll précédent :
      try {
        history.pushState({ sectionId }, '', newHash);
      } catch {
        // fallback si restriction CSP
        location.hash = newHash;
      }
    }
  }

  function activateButton(btns, el) {
    btns.forEach(b => { b.classList.remove('primary'); b.classList.add('ghost'); });
    el.classList.remove('ghost');
    el.classList.add('primary');
    try { localStorage.setItem(STORAGE_KEY, String(btns.indexOf(el))); } catch {}
  }

  function findButtonByTarget(btns, target) {
    return btns.find(b => (b.dataset.target || '').trim() === target);
  }

  // ====== Flot principal ======
  function init() {
    const wrap = qs(SELECTORS.buttonsWrap);
    if (!wrap) return;

    const btns = qsa(SELECTORS.button, wrap);
    if (!btns.length) return;

    // 1) AU CHARGEMENT : déterminer la section à montrer
    // Priorité : hash de l’URL (#contact / #rdv) > storage > rien
    let targetFromHash = '';
    if (location.hash) {
      const raw = location.hash.replace('#', '').trim().toLowerCase();
      if (VALID_TARGETS.has(raw)) targetFromHash = raw;
    }

    const savedIndex = parseInt(localStorage.getItem(STORAGE_KEY) || '', 10);
    const savedBtn   = (!Number.isNaN(savedIndex) && btns[savedIndex]) ? btns[savedIndex] : null;
    const savedTarget = savedBtn ? (savedBtn.dataset.target || '').trim() : '';

    if (targetFromHash) {
      // Hash présent → on respecte le hash
      showOnly(targetFromHash);
      const btn = findButtonByTarget(btns, targetFromHash);
      if (btn) activateButton(btns, btn);
      // Scroll initial (utilise replaceState pour ne pas empiler l’historique au chargement)
      requestAnimationFrame(() => scrollToSection(targetFromHash, false));
    } else if (savedBtn && VALID_TARGETS.has(savedTarget)) {
      // Pas de hash → on restaure l’état mémorisé
      activateButton(btns, savedBtn);
      showOnly(savedTarget);
      // Pas de scroll automatique au chargement (évite les surprises)
    } else {
      // Par défaut : tout est caché (conforme à ta règle UX)
      showOnly(null);
    }

    // 2) CLICK : activer le bouton, afficher la section et scroller avec offset
    wrap.addEventListener('click', (e) => {
      const a = e.target.closest('a.btn');
      if (!a || !wrap.contains(a)) return;

      // État visuel du bouton
      activateButton(btns, a);

      // Cible de section
      const target = (a.dataset.target || '').trim().toLowerCase();
      const href   = a.getAttribute('href') || '';

      if (VALID_TARGETS.has(target)) {
        // Empêche le comportement d’ancre natif : on gère l’offset nous-mêmes
        e.preventDefault();
        // Affiche la section cible, masque l’autre
        showOnly(target);
        // Scroll doux compensé et MAJ du hash (pushState)
        scrollToSection(target, true);
        return;
      }

      // Si pas de target gérable (#tel, mailto, liens externes) :
      // - on laisse le lien fonctionner normalement
      // - mais on ne masque/affiche rien (utile pour "Appeler", "mailto", etc.)
      // NB : si href commence par "#" mais sans target valide, on peut choisir d’annuler.
      if (href.startsWith('#')) {
        // Optionnel : empêcher de scroller vers une ancre non gérée
        // e.preventDefault();
      }
    });

    // 3) HASH CHANGE : si l’utilisateur modifie le hash (ex: bouton retour)
    window.addEventListener('hashchange', () => {
      const raw = location.hash.replace('#', '').trim().toLowerCase();
      if (!VALID_TARGETS.has(raw)) return;
      showOnly(raw);
      const btn = findButtonByTarget(btns, raw);
      if (btn) activateButton(btns, btn);
      // Scroll avec remplacement d’historique (évite d’empiler à chaque hashchange)
      scrollToSection(raw, false);
    });

    // 4) RESIZE : si la hauteur du header change (ex: responsive), on peut réaligner au besoin
    // Ici, on ne resynchronise que si un hash valide est présent (comportement discret)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (!location.hash) return;
      const raw = location.hash.replace('#', '').trim().toLowerCase();
      if (!VALID_TARGETS.has(raw)) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Scroll discret à la même section pour recalculer l’offset
        scrollToSection(raw, false);
      }, 120);
    });
  }

  // Initialisation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
