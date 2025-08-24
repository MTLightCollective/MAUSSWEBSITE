// functions/api/contact.ts
// Cloudflare Pages Function to accept form POST and send an email via Resend API.
export const onRequestOptions: PagesFunction = async ({ request }) => {
  const headers = corsHeaders(request);
  return new Response(null, { status: 204, headers });
};

export const onRequestPost: PagesFunction = async (ctx) => {
  const { request, env } = ctx;
  try {
    const headers = corsHeaders(request);
    const contentType = request.headers.get("content-type") || "";
    let form: FormData;
    if (contentType.includes("application/json")) {
      const data = await request.json();
      form = new FormData();
      for (const [k, v] of Object.entries(data)) form.set(k, String(v ?? ""));
    } else {
      form = await request.formData();
    }

    const name = sanitize(form.get("name"));
    const email = sanitize(form.get("email"));
    const message = sanitize(form.get("message"), 5000);
    const gotcha = String(form.get("_gotcha") || "");
    let subject = sanitize(form.get("subject") || "", 200);

    if (gotcha) return new Response(JSON.stringify({ ok: true }), { status: 200, headers });

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Champs requis manquants." }), { status: 400, headers });
    }
    if (!isEmail(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Format de courriel invalide." }), { status: 400, headers });
    }
    if (!subject) subject = "Nouveau message (site MAUSS)";
    subject = subject.replace(/[\r\n]/g, " ").slice(0, 200);

    const bodyText = `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`;

    const RESEND_API_KEY = env.RESEND_API_KEY;
    const TO_ADDRESS = env.TO_ADDRESS;
    const FROM_ADDRESS = env.FROM_ADDRESS || "onboarding@resend.dev"; // pour tests rapides; changez après vérification de domaine

    if (!RESEND_API_KEY || !TO_ADDRESS) {
      return new Response(JSON.stringify({ ok: false, error: "Configuration manquante côté serveur." }), { status: 500, headers });
    }

    const payload = {
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      subject,
      text: bodyText,
      reply_to: email
    };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ ok: false, error: "Envoi impossible", details: t }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    const headers = corsHeaders(request);
    return new Response(JSON.stringify({ ok: false, error: "Erreur serveur." }), { status: 500, headers });
  }
};

export const onRequestGet: PagesFunction = async ({ request }) => {
  const headers = corsHeaders(request);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};

function isEmail(x: any) {
  const s = String(x || "").toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function sanitize(x: any, max = 5000) {
  return String(x ?? "").replace(/\0/g, "").slice(0, max).trim();
}
function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin") || "";
  const allow = (request as any).cf?.tlsVersion ? origin : origin; // simple pass-through
  return new Headers({
    "Access-Control-Allow-Origin": allow || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
    "Access-Control-Allow-Headers": "content-type,accept",
    "Content-Type": "application/json; charset=utf-8"
  });
}
