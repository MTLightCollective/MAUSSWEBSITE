// ---------- Contact form ----------
(function(){
  const cf = document.getElementById('contact-form');
  if (!cf) return;
  cf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = cf.querySelector('.form-status');
    const submitBtn = cf.querySelector('button[type="submit"]');
    statusEl.textContent = 'Envoi en cours…';
    statusEl.className = 'form-status';
    submitBtn.disabled = true;

    if (!cf.reportValidity()) {
      statusEl.textContent = 'Veuillez corriger les champs en surbrillance.';
      submitBtn.disabled = false;
      return;
    }

    const data = new FormData(cf);
    if (data.get('_gotcha')) { statusEl.textContent = ''; submitBtn.disabled = false; return; }

    try {
      const res = await fetch(cf.action, {
        method: cf.method || 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });
      if (res.ok) {
        cf.reset();
        statusEl.textContent = 'Merci ! Votre message a été envoyé.';
        statusEl.classList.add('success');
      } else {
        statusEl.textContent = 'Une erreur est survenue. Essayez à nouveau plus tard.';
        statusEl.classList.add('error');
      }
    } catch (err) {
      statusEl.textContent = 'Connexion impossible. Vérifiez votre réseau.';
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();

// ---------- RDV form ----------
(function(){
  const form = document.getElementById('rdv-form');
  if (!form) return;
  const nameEl = document.getElementById('rdv-name');
  const emailEl = document.getElementById('rdv-email');
  const dateEl = document.getElementById('rdv-date');
  const slotEl = document.getElementById('rdv-slot');
  const notesEl = document.getElementById('rdv-notes');
  const subjectEl = document.getElementById('rdv-subject');
  const statusEl = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Min date = aujourd'hui (local)
  const today = new Date();
  const tzoffset = today.getTimezoneOffset() * 60000;
  dateEl.min = new Date(Date.now()-tzoffset).toISOString().slice(0,10);

  function pad2(n){ return String(n).padStart(2,'0'); }
  function toDDMMYYYY(iso){ const [y,m,d] = iso.split('-'); return `${d}-${m}-${y}`; }

  function generateSlots(){
    slotEl.innerHTML = "";
    for (let h=9; h<=16; h++){
      for (let m of [0,30]){
        const startH = pad2(h), startM = pad2(m);
        const endDate = new Date(0,0,0,h,m);
        endDate.setMinutes(endDate.getMinutes()+30);
        const endH = pad2(endDate.getHours()), endM = pad2(endDate.getMinutes());
        const opt = document.createElement('option');
        opt.value = `${startH}:${startM}`;
        opt.textContent = `${startH}:${startM}–${endH}:${endM}`;
        slotEl.appendChild(opt);
      }
    }
  }
  generateSlots();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = "Envoi en cours…";
    statusEl.className = "form-status";
    submitBtn.disabled = true;

    if (!form.reportValidity()){
      statusEl.textContent = "Veuillez compléter les champs requis.";
      submitBtn.disabled = false;
      return;
    }

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const date = dateEl.value;
    const slot = slotEl.value;
    const notes = (notesEl.value||"").trim();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";

    subjectEl.value = `Demande de rendez-vous – ${name}`;

    const begin = new Date(`${date}T${slot}:00`);
    const end = new Date(begin.getTime()+30*60000);
    const label = `${pad2(begin.getHours())}:${pad2(begin.getMinutes())}–${pad2(end.getHours())}:${pad2(end.getMinutes())}`;

    const bodyLines = [
      "Demande de rendez-vous (via mauss.ca)",
      `Nom: ${name}`,
      `Email: ${email}`,
      `Date souhaitée: ${toDDMMYYYY(date)}`,
      `Créneau: ${label}`,
      `Fuseau horaire du client: ${tz}`,
      notes ? `Commentaires: ${notes}` : ""
    ].filter(Boolean);

    const fd = new FormData(form);
    fd.set("message", bodyLines.join("\\n"));

    try {
      const res = await fetch(form.action, { method: "POST", headers: { "Accept":"application/json" }, body: fd });
      if (res.ok){
        form.reset();
        generateSlots();
        statusEl.textContent = "Votre demande a été envoyée. Je vous répondrai dans les plus brefs délais avec une invitation par visio (Google Meet).";
        statusEl.classList.add('success');
      } else {
        statusEl.textContent = "Erreur d’envoi. Réessayez plus tard ou écrivez à contact@mauss.ca.";
        statusEl.classList.add('error');
      }
    } catch (err){
      statusEl.textContent = "Connexion impossible. Vérifiez votre réseau et réessayez.";
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();

// ---------- (Optionnel) Fallback vers Pages.dev si /api/health indisponible ----------
(async function(){
  try {
    const res = await fetch("/api/health", { method: "GET" });
    if (!res.ok) throw new Error("health not ok");
  } catch {
    const API = "https://mausswebsite.pages.dev/api/contact";
    const forms = document.querySelectorAll('form[action="/api/contact"]');
    forms.forEach(f => f.setAttribute("action", API));
    console.log("[contact] Fallback action ->", API);
  }
})();