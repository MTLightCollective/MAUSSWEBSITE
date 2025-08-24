// functions/api/contact.ts (honeypot disabled)
export const onRequestOptions: PagesFunction = async ({ request }) => {
  const headers = corsHeaders(request);
  return new Response(null, { status: 204, headers });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const headers = corsHeaders(request);
  try {
    const contentType = request.headers.get("content-type") || "";
    let form: FormData;
    if (contentType.includes("application/json")) {
      const data = await request.json();
      form = new FormData();
      for (const [k, v] of Object.entries(data)) form.set(k, String(v ?? ""));
    } else {
      form = await request.formData();
    }

    // --- Fields ---
    const name = sanitize(form.get("name"));
    const email = sanitize(form.get("email"));
    const message = sanitize(form.get("message"), 5000);
    let subject = sanitize(form.get("subject") || "", 200);

    // Ignore honeypot field if present (no early return)
    // const gotcha = String(form.get("_gotcha") || "");

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Champs requis manquants." }), { status: 400, headers });
    }
    if (!isEmail(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Format de courriel invalide." }), { status: 400, headers });
    }
    if (!subject) subject = "Nouveau message (site MAUSS)";
    subject = subject.replace(/[\r\n]/g, " ").slice(0, 200);

    // --- Turnstile verification ---
    const token = String(form.get("cf-turnstile-response") || "");
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "Captcha manquant." }), { status: 400, headers });
    }
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const verifyResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
    });
    const verifyData: any = await verifyResp.json();
    if (!verifyData.success) {
      return new Response(JSON.stringify({ ok: false, error: "Validation anti-robot échouée." }), { status: 400, headers });
    }

    // --- Resend ---
    const RESEND_API_KEY = env.RESEND_API_KEY;
    const TO_ADDRESS = env.TO_ADDRESS;
    const FROM_ADDRESS = env.FROM_ADDRESS || "onboarding@resend.dev";
    if (!RESEND_API_KEY || !TO_ADDRESS) {
      return new Response(JSON.stringify({ ok: false, error: "Configuration manquante côté serveur." }), { status: 500, headers });
    }

    const bodyText = `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`;
    const payload = { from: FROM_ADDRESS, to: [TO_ADDRESS], subject, text: bodyText, reply_to: email };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    let data: any = null; try { data = JSON.parse(text); } catch {}

    if (!r.ok) {
      return new Response(JSON.stringify({ ok: false, error: "Envoi impossible", status: r.status, details: data || text }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id || null }), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: "Erreur serveur.", details: String(err?.message || err) }), { status: 500, headers });
  }
};

export const onRequestGet: PagesFunction = async ({ request }) => {
  const headers = corsHeaders(request);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};

function isEmail(x: any) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x || "").toLowerCase()); }
function sanitize(x: any, max = 5000) { return String(x ?? "").replace(/\0/g, "").slice(0, max).trim(); }
function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin") || "";
  return new Headers({
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
    "Access-Control-Allow-Headers": "content-type,accept",
    "Content-Type": "application/json; charset=utf-8"
  });
}
