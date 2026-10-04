import Link from "next/link";
import { BrandMark } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="app-shell">
      <SiteHeader variant="marketing" />
      <main id="main" className="content-page is-status">
        <div className="status-mark">
          <BrandMark />
        </div>
        <p className="step-label">404</p>
        <h1>This page does not exist</h1>
        <p>The link may be old, or the address may have a typo.</p>
        <Link className="primary-button" href="/">
          Go to the home page
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
