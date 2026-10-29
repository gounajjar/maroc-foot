import "server-only";

// E-mails (account validation, password reset) are sent with Resend
// (RESEND_API_KEY on Vercel), from an address of the maroc-foot.com domain.
const key = () => process.env.RESEND_API_KEY?.trim() ?? "";
export const canSendMail = () => key().length > 0;
const from = () => process.env.MAIL_FROM?.trim() || "Maroc-Foot <noreply@maroc-foot.com>";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type Mail = { to: string; subject: string; intro: string; button: string; link: string; outro: string; rtl: boolean };

export async function sendMail(m: Mail) {
  const dir = m.rtl ? "rtl" : "ltr";
  const html = `<!doctype html><html dir="${dir}"><body style="margin:0;background:#f6f1ea;font-family:Arial,Tahoma,sans-serif;color:#12100f">
<div style="max-width:520px;margin:0 auto;padding:24px">
<div style="background:#c1272d;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0;font-weight:800;font-size:20px;letter-spacing:1px">MAROC·FOOT</div>
<div style="background:#fff;padding:24px 20px;border-radius:0 0 12px 12px">
<p style="margin:0 0 20px;line-height:1.5">${escape(m.intro)}</p>
<p style="margin:0 0 20px"><a href="${escape(m.link)}" style="display:inline-block;background:#006233;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">${escape(m.button)}</a></p>
<p style="margin:0;font-size:13px;color:#666;line-height:1.5">${escape(m.outro)}</p>
<p style="margin:16px 0 0;font-size:12px;color:#999;word-break:break-all" dir="ltr">${escape(m.link)}</p>
</div></div></body></html>`;
  const text = `${m.intro}\n\n${m.button} : ${m.link}\n\n${m.outro}`;

  if (!canSendMail()) {
    // Local development without a key: the link is printed instead.
    console.log(`[mail to ${m.to}] ${m.subject}\n${m.link}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: from(), to: [m.to], subject: m.subject, html, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
