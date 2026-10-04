export const SITE_NAME = "Luna";

export const SITE_DESCRIPTION =
  "A free, private period tracker. Log your period and see your next period on the calendar. Fertile window, ovulation and PMS days if you ask.";

export const HEALTH_DISCLAIMER =
  "Luna is a tracking tool. Dates are estimates, not a diagnosis, and must not be used as contraception. Talk to a doctor about anything that worries you.";

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}
