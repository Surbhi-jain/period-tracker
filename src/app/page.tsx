"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CycleEstimateCard } from "@/components/cycle-estimate-card";
import { GoogleAuth } from "@/components/google-auth";
import { daysBetween, formatDate, rangesOverlap, todayLocal } from "@/lib/dates";
import type { PeriodEntry } from "@/lib/cycle-estimate";
import type { Profile } from "@/lib/tracker-types";

const PROFILE_KEY = "luna-profile-v1";
const PERIODS_KEY = "luna-periods-v1";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 42 42" role="img">
        <path d="M29.7 7.8A14.7 14.7 0 1 0 34 31.1 16.8 16.8 0 1 1 29.7 7.8Z" />
        <circle cx="31.8" cy="11.2" r="2.1" />
      </svg>
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4 9h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function Home() {
  const { status } = useSession();
  const useCloud = status === "authenticated";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<PeriodEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [profileMode, setProfileMode] = useState<"age" | "dob">("age");
  const [age, setAge] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [canCancelProfile, setCanCancelProfile] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    async function loadSavedData() {
      setReady(false);
      try {
        if (useCloud) {
          const [profileRes, periodsRes] = await Promise.all([
            fetch("/api/profile"),
            fetch("/api/periods"),
          ]);
          const profileBody = (await profileRes.json()) as {
            profile?: Profile | null;
            error?: string;
          };
          const periodsBody = (await periodsRes.json()) as {
            periods?: PeriodEntry[];
            error?: string;
          };
          if (!profileRes.ok || !periodsRes.ok) {
            throw new Error(
              profileBody.error ||
                periodsBody.error ||
                "Could not load your saved data.",
            );
          }

          let nextProfile = profileBody.profile ?? null;
          let nextEntries = periodsBody.periods ?? [];

          if (!nextProfile) {
            const localProfile = localStorage.getItem(PROFILE_KEY);
            if (localProfile) {
              const parsed = JSON.parse(localProfile) as Profile;
              const saveRes = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed),
              });
              if (saveRes.ok) nextProfile = parsed;
            }
          }
          if (nextEntries.length === 0) {
            const localEntries = localStorage.getItem(PERIODS_KEY);
            if (localEntries) {
              const parsed = JSON.parse(localEntries) as PeriodEntry[];
              const uploaded: PeriodEntry[] = [];
              for (const entry of parsed) {
                const saveRes = await fetch("/api/periods", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    startDate: entry.startDate,
                    endDate: entry.endDate,
                  }),
                });
                if (saveRes.ok) {
                  const saved = (await saveRes.json()) as { period: PeriodEntry };
                  uploaded.push(saved.period);
                }
              }
              if (uploaded.length) nextEntries = uploaded;
            }
          }

          if (cancelled) return;
          setProfile(nextProfile);
          setEntries(nextEntries);
          setCanCancelProfile(Boolean(nextProfile));
        } else {
          const savedProfile = localStorage.getItem(PROFILE_KEY);
          const savedEntries = localStorage.getItem(PERIODS_KEY);
          if (cancelled) return;
          if (savedProfile) {
            setProfile(JSON.parse(savedProfile) as Profile);
            setCanCancelProfile(true);
          } else {
            setProfile(null);
            setCanCancelProfile(false);
          }
          setEntries(
            savedEntries ? (JSON.parse(savedEntries) as PeriodEntry[]) : [],
          );
        }
      } catch {
        if (!cancelled) {
          setMessage("We could not read your saved data.");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadSavedData();
    return () => {
      cancelled = true;
    };
  }, [status, useCloud]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [entries],
  );

  const today = todayLocal();

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    let nextProfile: Profile;
    if (profileMode === "age") {
      const ageNumber = Number(age);
      if (!Number.isInteger(ageNumber) || ageNumber < 13 || ageNumber > 100) {
        setMessage("Please enter an age between 13 and 100.");
        return;
      }
      nextProfile = { mode: "age", age: ageNumber };
    } else {
      if (!dateOfBirth || dateOfBirth > today) {
        setMessage("Please enter a valid date of birth.");
        return;
      }
      nextProfile = { mode: "dob", dateOfBirth };
    }

    if (useCloud) {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextProfile),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(body.error ?? "Could not save your profile.");
        return;
      }
    } else {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    }

    setProfile(nextProfile);
    setCanCancelProfile(true);
  }

  function persistLocalEntries(nextEntries: PeriodEntry[], successMessage: string) {
    localStorage.setItem(PERIODS_KEY, JSON.stringify(nextEntries));
    setEntries(nextEntries);
    setStartDate("");
    setEndDate("");
    setEditingId(null);
    setMessage(successMessage);
  }

  async function logPeriod(nextStart: string, nextEnd: string) {
    setMessage("");

    if (!nextStart || !nextEnd) {
      setMessage("Please select both the start day and end day of bleeding.");
      return;
    }
    if (nextEnd < nextStart) {
      setMessage("The end day of bleeding cannot be before the start day.");
      return;
    }
    if (nextStart > today || nextEnd > today) {
      setMessage("Period dates cannot be in the future.");
      return;
    }
    if (daysBetween(nextStart, nextEnd) > 20) {
      setMessage("Please check the dates. A period entry cannot exceed 20 days.");
      return;
    }
    if (
      entries.some(
        (entry) =>
          entry.id !== editingId &&
          rangesOverlap(entry.startDate, entry.endDate, nextStart, nextEnd),
      )
    ) {
      setMessage("This overlaps another saved period. Update or remove that entry first.");
      return;
    }

    if (useCloud) {
      const response = await fetch(
        editingId ? `/api/periods/${editingId}` : "/api/periods",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: nextStart, endDate: nextEnd }),
        },
      );
      const body = (await response.json()) as {
        period?: PeriodEntry;
        error?: string;
      };
      if (!response.ok || !body.period) {
        setMessage(body.error ?? "Could not save this period.");
        return;
      }
      const saved = body.period;
      const nextEntries = editingId
        ? entries.map((entry) => (entry.id === editingId ? saved : entry))
        : [saved, ...entries];
      setEntries(nextEntries);
      setStartDate("");
      setEndDate("");
      setEditingId(null);
      setMessage(editingId ? "Period updated successfully." : "Period saved successfully.");
      return;
    }

    if (editingId) {
      const nextEntries = entries.map((entry) =>
        entry.id === editingId
          ? { ...entry, startDate: nextStart, endDate: nextEnd }
          : entry,
      );
      persistLocalEntries(nextEntries, "Period updated successfully.");
      return;
    }

    const nextEntry: PeriodEntry = {
      id: crypto.randomUUID(),
      startDate: nextStart,
      endDate: nextEnd,
    };
    persistLocalEntries([nextEntry, ...entries], "Period saved successfully.");
  }

  async function savePeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await logPeriod(startDate, endDate);
  }

  async function startPeriodToday() {
    await logPeriod(today, today);
  }

  function beginEditEntry(entry: PeriodEntry) {
    setEditingId(entry.id);
    setStartDate(entry.startDate);
    setEndDate(entry.endDate);
    setMessage("");
    document.getElementById("period-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEditEntry() {
    setEditingId(null);
    setStartDate("");
    setEndDate("");
    setMessage("");
  }

  async function deleteEntry(id: string) {
    if (useCloud) {
      const response = await fetch(`/api/periods/${id}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(body.error ?? "Could not remove this entry.");
        return;
      }
    } else {
      localStorage.setItem(
        PERIODS_KEY,
        JSON.stringify(entries.filter((entry) => entry.id !== id)),
      );
    }

    setEntries(entries.filter((entry) => entry.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setStartDate("");
      setEndDate("");
    }
    setMessage("Entry removed.");
  }

  function resetProfile() {
    if (profile?.mode === "age") {
      setProfileMode("age");
      setAge(String(profile.age));
      setDateOfBirth("");
    } else if (profile?.mode === "dob") {
      setProfileMode("dob");
      setDateOfBirth(profile.dateOfBirth);
      setAge("");
    }
    setProfile(null);
    setMessage("");
  }

  async function cancelProfileEdit() {
    if (useCloud) {
      const response = await fetch("/api/profile");
      const body = (await response.json()) as { profile?: Profile | null };
      if (body.profile) setProfile(body.profile);
      setMessage("");
      return;
    }
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (!savedProfile) return;
    setProfile(JSON.parse(savedProfile) as Profile);
    setMessage("");
  }

  if (!ready) {
    return <main className="loading">Loading your private tracker…</main>;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Luna period tracker home">
          <BrandMark />
          <span>Luna</span>
        </a>
        <div className="header-actions">
          <div className="privacy-chip"><LockIcon /> <span>{useCloud ? "Saved to your account" : "Stored on this device"}</span></div>
          <GoogleAuth />
        </div>
      </header>

      <main id="top">
        {!profile ? (
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span /> Private. Simple. Yours.</div>
              <h1>Understand your cycle, <em>one day at a time.</em></h1>
              <p>Luna helps you keep a simple record of your period. Sign in with Google to save across devices, or keep data only in this browser.</p>
            </div>
            <div className="hero-art" aria-hidden="true">
              <span className="orb orb-one" />
              <span className="orb orb-two" />
              <span className="spark spark-one">✦</span>
              <span className="spark spark-two">✦</span>
              <div className="moon"><BrandMark /></div>
            </div>
          </section>
        ) : null}

        {!profile ? (
          <section className="card onboarding-card" aria-labelledby="setup-title">
            <div className="step-label">{canCancelProfile ? "YOUR PROFILE" : "STEP 1 OF 2"}</div>
            <h2 id="setup-title">{canCancelProfile ? "Edit your details" : "Let’s begin with you"}</h2>
            <p className="card-copy">This helps personalize your experience. Choose whichever option you’re comfortable sharing.</p>

            <div className="segment" role="group" aria-label="Choose profile information">
              <button className={profileMode === "age" ? "active" : ""} onClick={() => setProfileMode("age")} type="button" aria-pressed={profileMode === "age"}>Enter age</button>
              <button className={profileMode === "dob" ? "active" : ""} onClick={() => setProfileMode("dob")} type="button" aria-pressed={profileMode === "dob"}>Date of birth</button>
            </div>

            <form onSubmit={saveProfile}>
              {profileMode === "age" ? (
                <label className="field">
                  <span>Your age</span>
                  <div className="input-with-suffix">
                    <input type="number" inputMode="numeric" min="13" max="100" value={age} onChange={(event) => setAge(event.target.value)} placeholder="e.g. 28" required />
                    <small>years</small>
                  </div>
                </label>
              ) : (
                <label className="field">
                  <span>Your date of birth</span>
                  <input type="date" max={today} value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} required />
                </label>
              )}
              {message && <p className="form-message error" role="alert">{message}</p>}
              <button className="primary-button" type="submit">Continue <span>→</span></button>
            </form>
            {canCancelProfile ? (
              <button className="secondary-button" type="button" onClick={cancelProfileEdit}>
                Cancel
              </button>
            ) : null}
            <p className="microcopy"><LockIcon /> {useCloud ? "Saved to your Supabase account" : "Saved only in your browser"}</p>
          </section>
        ) : (
          <section className="tracker-grid">
            <div className="profile-bar">
              <div>
                <span className="welcome-dot" />
                <p>Welcome to your private space</p>
                <strong>{profile.mode === "age" ? `${profile.age} years old` : `Born ${formatDate(profile.dateOfBirth)}`}</strong>
              </div>
              <button type="button" onClick={resetProfile}>Edit profile</button>
            </div>

            <CycleEstimateCard entries={entries} today={today} />

            <section className="card period-card" aria-labelledby="period-title">
              <div className="icon-box"><CalendarIcon /></div>
              <div className="step-label">{editingId ? "UPDATE" : "LOG"}</div>
              <h2 id="period-title">{editingId ? "Update this period" : "Record your period"}</h2>
              <p className="card-copy">
                {editingId
                  ? "Change the start day of bleeding and the end day of bleeding, then save."
                  : "Enter the start day of bleeding and the end day of bleeding. If bleeding started today, tap the button below."}
              </p>

              <form onSubmit={savePeriod}>
                <div className="date-grid">
                  <label className="field">
                    <span>Start day of bleeding</span>
                    <input type="date" max={today} value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
                  </label>
                  <label className="field">
                    <span>End day of bleeding</span>
                    <input type="date" min={startDate || undefined} max={today} value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
                  </label>
                </div>
                {message && <p className={`form-message ${message.includes("successfully") || message.includes("removed") || message.includes("updated") ? "success" : "error"}`} role="status">{message}</p>}
                <button className="primary-button" type="submit">{editingId ? "Update period" : "Save period"} <span>{editingId ? "✓" : "＋"}</span></button>
              </form>
              {editingId ? (
                <button className="secondary-button" type="button" onClick={cancelEditEntry}>
                  Cancel update
                </button>
              ) : (
                <button className="secondary-button" type="button" onClick={startPeriodToday}>
                  Bleeding started today
                </button>
              )}
            </section>

            <section className="history" aria-labelledby="history-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow-mini">YOUR HISTORY</span>
                  <h2 id="history-title">Previous periods</h2>
                </div>
                <span className="count">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
              </div>

              {sortedEntries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><CalendarIcon /></div>
                  <h3>No periods recorded yet</h3>
                  <p>Your saved periods will appear here.</p>
                </div>
              ) : (
                <div className="entry-list">
                  {sortedEntries.map((entry) => (
                    <article className={`entry${editingId === entry.id ? " is-editing" : ""}`} key={entry.id}>
                      <div className="entry-date"><span>{new Date(`${entry.startDate}T00:00:00Z`).getUTCDate()}</span>{new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(new Date(`${entry.startDate}T00:00:00Z`))}</div>
                      <div className="entry-detail">
                        <strong>{formatDate(entry.startDate)} – {formatDate(entry.endDate)}</strong>
                        <span>{daysBetween(entry.startDate, entry.endDate)} {daysBetween(entry.startDate, entry.endDate) === 1 ? "day" : "days"}</span>
                      </div>
                      <div className="entry-actions">
                        <button className="update-button" onClick={() => beginEditEntry(entry)} type="button" aria-label={`Update period from ${formatDate(entry.startDate)}`}>Update</button>
                        <button className="delete-button" onClick={() => deleteEntry(entry.id)} type="button" aria-label={`Delete period from ${formatDate(entry.startDate)}`}>Remove</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      <footer>
        <BrandMark />
        <p><strong>Your body. Your data.</strong><br />Luna is a tracking tool. Period dates are estimates, not diagnoses, and must not be used as contraception.</p>
      </footer>
    </div>
  );
}
