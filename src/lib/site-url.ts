export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cepepa-site.cepepasite.workers.dev"
).replace(/\/$/, "");
