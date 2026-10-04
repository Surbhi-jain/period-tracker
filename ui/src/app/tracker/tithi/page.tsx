import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TithiApp } from "@/components/tracker/tithi-app";

export const metadata: Metadata = {
  title: "Moon and tithi",
  robots: { index: false, follow: false },
};

export default function TithiPage() {
  return (
    <div className="app-shell is-app">
      <SiteHeader variant="app" />
      <main id="main" className="tracker-main">
        <TithiApp />
      </main>
      <SiteFooter variant="app" />
    </div>
  );
}
