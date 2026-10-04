"use client";

import { useEffect } from "react";
import { BrandMark } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[Luna] page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="app-shell">
      <SiteHeader variant="marketing" />
      <main id="main" className="content-page is-status">
        <div className="status-mark">
          <BrandMark />
        </div>
        <p className="step-label">SOMETHING WENT WRONG</p>
        <h1>Sorry, this page could not load</h1>
        <p>Your saved data is safe. Please try again.</p>
        <button className="primary-button" type="button" onClick={() => retry()}>
          Try again
        </button>
      </main>
      <SiteFooter />
    </div>
  );
}
