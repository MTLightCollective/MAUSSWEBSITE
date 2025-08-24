export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const headers = new Headers({ "content-type": "application/json" });
  const contentType = request.headers.get("content-type") || "";
  let form: FormData;
  if (contentType.includes("application/json")) {
    const data = await request.json();
    form = new FormData();
    for (const [k, v] of Object.entries(data)) form.set(k, String(v ?? ""));
  } else {
    form = await request.formData();
  const token = String(form.get("cf-turnstile-response") || "");
  const headers = new Headers({ "content-type": "application/json" });
  if (!token) return new Response(JSON.stringify({ ok: false, error: "Captcha manquant." }), { status: 400, headers });
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const verifyResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  });
  const verifyData: any = await verifyResp.json();
  if (!verifyData.success) {
    return new Response(JSON.stringify({ ok: false, error: "Validation anti-robot échouée." }), { status: 400, headers });
  }
  
  }
  const name = String(form.get("name") || "");
  const email = String(form.get("email") || "");
  const message = String(form.get("message") || "");
  return new Response(JSON.stringify({ ok: true, name, email, message }), { status: 200, headers });
};