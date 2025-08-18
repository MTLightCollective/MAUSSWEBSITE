
/* Minimal enhancement: dynamic year + mail subject builder */
const yearSpan = document.querySelector('[data-year]');
if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString();

const contactLink = document.querySelector('[data-mailto]');
if (contactLink) {
  const subj = encodeURIComponent('Prise de contact – Site web MAUSS CPA');
  const body = encodeURIComponent('Bonjour,\n\nJe souhaite discuter de mes besoins en comptabilité.\n\n— Envoyé depuis la page en construction');
  const href = contactLink.getAttribute('href');
  if (href && href.startsWith('mailto:')) {
    contactLink.setAttribute('href', href + '?subject=' + subj + '&body=' + body);
  }
}
