import Link from "next/link";
import {
  CalendarIcon,
  LockIcon,
  MoonIcon,
  ShieldIcon,
  SparkIcon,
  TrashIcon,
} from "@/components/icons";
import { MarketingCalendar } from "@/components/marketing-calendar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { latestPosts } from "@/lib/blog";
import { formatDate } from "@/lib/dates";

const STEPS = [
  {
    title: "Log your period",
    body: "Pick the start day and end day of bleeding. It takes about ten seconds.",
  },
  {
    title: "Luna does the maths",
    body: "Your average cycle is worked out from the time between each period start, not from a fixed 28 days.",
  },
  {
    title: "See what is coming",
    body: "Your next period on the calendar. Fertile window, estimated ovulation and PMS days if you ask to see them.",
  },
];

const SIDE_FEATURES = [
  {
    icon: <CalendarIcon />,
    tone: "rose",
    title: "Next period estimate",
    body: "A date range, not a single guess, with how many days it may shift and how confident Luna is.",
  },
  {
    icon: <SparkIcon />,
    tone: "sage",
    title: "Fertile window and ovulation",
    body: "Ask on the calendar to see them. Ovulation is estimated 14 days before your next period, with the 6 days around it marked as fertile.",
  },
  {
    icon: <MoonIcon />,
    tone: "lavender",
    title: "PMS days",
    body: "Ask on the calendar to mark the days before your period, so mood changes or cramps do not catch you off guard.",
  },
];

const TRUST = [
  { icon: <LockIcon />, text: "Works without an account. Data stays in your browser." },
  { icon: <ShieldIcon />, text: "No ads. Your health data is never sold." },
  { icon: <TrashIcon />, text: "Download or delete everything, any time." },
];

const FAQ = [
  {
    question: "How accurate are the predictions?",
    answer:
      "With one logged period, Luna uses a typical 28-day cycle, so the estimate is rough. After two or three periods it uses your own average and shows how much your cycles vary. Stress, illness, travel and some medicines can move a period or ovulation, so treat every date as an estimate.",
  },
  {
    question: "Can I use Luna to avoid pregnancy?",
    answer:
      "No. Calendar estimates are not reliable contraception, because ovulation can happen earlier or later than expected even in regular cycles. Please talk to a doctor about contraception that suits you.",
  },
  {
    question: "Can Luna help if I am trying to conceive?",
    answer:
      "If you ask on the calendar, Luna can mark estimated fertile days. That is a starting point, not a conception plan or a test. If you have been trying for a year (or six months if you are over 35), or your cycles are very irregular, see a doctor.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. Without signing in, everything is saved only in this browser. Sign in with Google if you want your records saved to your account and available on other devices.",
  },
  {
    question: "Does Luna read my Gmail?",
    answer:
      "No. Google sign-in only shares your name, email address and profile picture with Luna. Luna never asks for access to your inbox, contacts or files.",
  },
  {
    question: "How do I delete my data?",
    answer:
      "Open the tracker and use “Delete all my data”. It removes every period you logged, straight away.",
  },
];

export default function HomePage() {
  return (
    <div className="app-shell">
      <SiteHeader variant="marketing" />

      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> Free · Private · No ads
            </p>
            <h1>
              Know your cycle. <em>See what is coming next.</em>
            </h1>
            <p>
              Luna is a simple period tracker for people who menstruate. Log
              the start day and end day of bleeding, and see your next period
              on the calendar. Fertile window, ovulation and PMS days stay
              off until you ask.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" href="/tracker">
                Start tracking free <span aria-hidden="true">→</span>
              </Link>
              <Link className="hero-text-link" href="#how-it-works">
                See how it works
              </Link>
            </div>
            <p className="hero-note">
              <LockIcon /> No sign-up needed to start. An account, if you want
              one, is Google only.
            </p>
          </div>

          <div className="hero-preview">
            <MarketingCalendar />
          </div>
        </section>

        <section className="trust-strip" aria-label="Why Luna">
          {TRUST.map((item) => (
            <p key={item.text}>
              {item.icon}
              {item.text}
            </p>
          ))}
        </section>

        <section id="how-it-works" className="section" aria-labelledby="how-title">
          <div className="section-intro is-left">
            <h2 id="how-title">How it works</h2>
            <p>Three simple steps. No app download.</p>
          </div>
          <ol className="steps-line">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className={`step-number tone-${index}`}>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="section" aria-labelledby="features-title">
          <div className="section-intro">
            <h2 id="features-title">Everything important, in one place</h2>
            <p>Built around the dates that matter, so you can see what is likely next.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card is-spotlight">
              <h3>Colour-coded calendar</h3>
              <p>
                Logged days and predicted days at a glance, months ahead.
                Fertile days and PMS days if you ask.
              </p>
              <MarketingCalendar compact showCaption={false} />
            </article>
            {SIDE_FEATURES.map((feature) => (
              <article key={feature.title} className="feature-card">
                <span className={`feature-icon ${feature.tone}`}>{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
          <p className="features-aside">
            After you log a period,{" "}
            <Link href="/tracker/tithi">Moon and tithi</Link> can show where
            those start days sat in the lunar month.
          </p>
        </section>

        <section className="section pattern-section" aria-labelledby="pattern-title">
          <div className="section-intro is-split">
            <h2 id="pattern-title">Keep a record. See the pattern.</h2>
            <p>
              The more periods you log, the closer the estimates get to your own
              body.
            </p>
          </div>
          <div className="compare">
            <div className="compare-card">
              <h3 className="rose-text">Just this browser</h3>
              <p>
                Start straight away, no account. Your records stay on this
                device only, and clearing browser data erases them.
              </p>
              <ul>
                <li>No sign-up</li>
                <li>Private to this device</li>
                <li>Delete any time</li>
              </ul>
            </div>
            <div className="compare-card is-accent">
              <h3 className="sage-text">With Google sign-in</h3>
              <p>
                Your records are saved to your account, so they are safe if you
                switch phones and available on any device.
              </p>
              <ul>
                <li>Follows you between devices</li>
                <li>Google email only — never Gmail</li>
                <li>Download or delete any time</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="section-intro">
            <h2 id="faq-title">Questions, answered</h2>
          </div>
          <div className="faq">
            {FAQ.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="journal" className="section" aria-labelledby="journal-title">
          <div className="section-intro">
            <h2 id="journal-title">From the journal</h2>
            <p>What your dates can show about health, and what they cannot.</p>
          </div>
          <ul className="home-blog-grid">
            {latestPosts(3).map((post) => (
              <li key={post.slug}>
                <article className="card blog-card">
                  <p className="page-meta">
                    <span>{post.topic}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </p>
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p>{post.description}</p>
                  <Link className="text-button blog-card-link" href={`/blog/${post.slug}`}>
                    Read this note <span aria-hidden="true">→</span>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
          <p className="home-blog-more">
            <Link href="/blog">All journal notes</Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
