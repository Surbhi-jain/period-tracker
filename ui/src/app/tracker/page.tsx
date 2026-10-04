import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackerApp } from "@/components/tracker/tracker-app";

export const metadata: Metadata = {
  title: "Your tracker",
  robots: { index: false, follow: false },
};

export default function TrackerPage() {
  return (
    <div className="app-shell is-app">
      <SiteHeader variant="app" />
      <main id="main" className="tracker-main">
        <TrackerApp />
      </main>
      <SiteFooter variant="app" />
    </div>
  );
}
