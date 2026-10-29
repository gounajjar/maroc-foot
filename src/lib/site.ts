// Address shown on the privacy page for data requests. Set CONTACT_EMAIL on
// Vercel to use another mailbox.
export const contactEmail = process.env.CONTACT_EMAIL?.trim() || "contact@maroc-foot.com";

// Public address of the site, used in the links of the e-mails it sends.
export const siteUrl = (process.env.SITE_URL?.trim() || "https://maroc-foot.com").replace(/\/+$/, "");
