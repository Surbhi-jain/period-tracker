import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HEALTH_DISCLAIMER } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Luna stores, where it is kept, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <div className="app-shell">
      <SiteHeader variant="marketing" />
      <main id="main" className="content-page is-read">
        <PageHero
          label="PRIVACY"
          title="Your data, in plain words"
          lead="Luna is built so you can track your cycle without giving away your health. Here is exactly what is stored, where it lives, and how to remove it."
          meta={<p>Last updated 4 October 2026</p>}
        />

        <div className="content-stack">
          <section className="card">
            <h2>What Luna stores</h2>
            <ul>
              <li>The start day and end day of each period you log.</li>
              <li>
                If you sign in with Google: your name, email address and profile
                picture, which Google shares so you can sign in.
              </li>
            </ul>
          </section>

          <section className="card">
            <h2>Where it is kept</h2>
            <p>
              <strong>Without signing in</strong>, everything stays in your
              browser&apos;s local storage on this device. It is never sent to
              Luna&apos;s servers. Clearing your browser data erases it.
            </p>
            <p>
              <strong>When you sign in</strong>, your periods are saved in
              Luna&apos;s database, linked to your email address, so you can see
              them on any device. Anything saved in this browser before you signed
              in is moved into your account and removed from the browser.
            </p>
          </section>

          <section className="card">
            <h2>What Luna does not do</h2>
            <ul>
              <li>No ads, and your health data is never sold or shared for marketing.</li>
              <li>No access to your Gmail, contacts, calendar or files.</li>
              <li>
                No tracking cookies. After Google sign-in, the backend keeps a
                session token so it knows it is you.
              </li>
            </ul>
          </section>

          <section className="card">
            <h2>Download or delete</h2>
            <p>
              In the <Link href="/tracker">tracker</Link>, use “Download my data”
              to get a copy of everything as a file, or “Delete all my data” to
              remove every period you logged, straight away.
            </p>
          </section>

          <section className="card">
            <h2>Health information</h2>
            <p>{HEALTH_DISCLAIMER}</p>
            <p>
              The next period, fertile window, ovulation day and PMS days are
              worked out from the periods you log, using a typical luteal phase of
              14 days. Stress, illness, travel, age and some medicines can move a
              cycle. If your cycles suddenly change, talk to a doctor.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
