"use client";

import { signIn, signOut, useSession } from "@/lib/auth-client";

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.4-1.1 2.6-2.4 3.4v2.8h3.8c2.3-2.1 3.6-5.2 3.6-8.3Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.9-2.8l-3.8-2.8c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v2.9C3.3 21.4 7.4 24 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.6c-.2-.7-.4-1.4-.4-2.1s.1-1.5.4-2.1V7.5H1.3C.5 9.1 0 10.5 0 12.5c0 2 .5 3.8 1.3 5.5l4-3.4Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.3 2.6 1.3 7.5l4 3.1C6.2 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

function Avatar({
  name,
  image,
}: {
  name: string;
  image?: string | null;
}) {
  const initial = name.charAt(0).toUpperCase();
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="google-avatar"
        src={image}
        alt=""
        referrerPolicy="no-referrer"
      />
    );
  }
  return <span className="google-avatar google-avatar-fallback">{initial}</span>;
}

export function GoogleAuth({
  tone = "button",
  layout = "header",
}: {
  tone?: "button" | "text";
  layout?: "header" | "menu";
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="google-auth-loading">Checking sign-in…</p>;
  }

  if (session?.user) {
    const label = session.user.name ?? session.user.email ?? "Signed in";

    if (layout === "menu") {
      return (
        <div className="google-auth">
          <Avatar name={label} image={session.user.image} />
          <span className="google-name">{label}</span>
          <button
            className="signout-button"
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            Sign out
          </button>
        </div>
      );
    }

    return (
      <details className="account-menu">
        <summary className="account-menu-toggle" aria-label={`Account, ${label}`}>
          <Avatar name={label} image={session.user.image} />
        </summary>
        <div className="account-menu-panel">
          <p className="account-menu-name">{label}</p>
          <button
            className="signout-button"
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            Sign out
          </button>
        </div>
      </details>
    );
  }

  return (
    <button
      className={tone === "text" ? "google-text" : "google-button"}
      type="button"
      onClick={() => signIn("google", { redirectTo: "/tracker" })}
    >
      <GoogleMark />
      <span className="google-button-full">Continue with Google</span>
      <span className="google-button-short">Sign in</span>
    </button>
  );
}
