import Link from "next/link";
import { AppNav } from "./app-nav";
import { GoogleAuth } from "./google-auth";
import { BrandMark } from "./icons";
import { MarketingNav } from "./marketing-nav";

export function SiteHeader({ variant }: { variant: "marketing" | "app" }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label="Luna home">
          <BrandMark />
          <span>Luna</span>
        </Link>

        {variant === "marketing" ? <MarketingNav /> : <AppNav />}

        <div className="header-actions">
          {variant === "marketing" ? (
            <>
              <Link className="header-cta" href="/tracker">
                Open tracker
              </Link>
              <GoogleAuth tone="text" />
              <details className="site-menu">
                <summary className="site-menu-toggle" aria-label="Menu">
                  Menu
                </summary>
                <div className="site-menu-panel">
                  <MarketingNav compact />
                  <div className="site-menu-account">
                    <GoogleAuth tone="text" layout="menu" />
                  </div>
                </div>
              </details>
            </>
          ) : (
            <GoogleAuth />
          )}
        </div>
      </div>
    </header>
  );
}
