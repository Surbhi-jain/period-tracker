import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("landing page", () => {
  it("has one main heading and the key sections", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: /See what is coming next/ })).toBeInTheDocument();
    expect(screen.queryByText(/Never miss an important day/)).toBeNull();
    for (const name of [
      "How it works",
      "Everything important, in one place",
      "Keep a record. See the pattern.",
      "From the journal",
      "Questions, answered",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
  });

  it("sends visitors to the tracker and links the privacy page", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /Start tracking free/ })).toHaveAttribute(
      "href",
      "/tracker",
    );
    expect(screen.getAllByRole("link", { name: "Open tracker" })[0]).toHaveAttribute(
      "href",
      "/tracker",
    );
    expect(screen.getByRole("link", { name: "See how it works" })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getAllByRole("link", { name: "Journal" })[0]).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: "All journal notes" })).toHaveAttribute("href", "/blog");
    expect(screen.getByText("October 2026")).toBeInTheDocument();
  });

  it("places FAQ above the journal teaser so the hash jump is the questions", () => {
    render(<HomePage />);
    const faq = screen.getByRole("heading", { name: "Questions, answered" });
    const journal = screen.getByRole("heading", { name: "From the journal" });
    expect(faq.compareDocumentPosition(journal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("What your dates can show about health, and what they cannot.")).toBeInTheDocument();
  });

  it("says clearly that Luna is not contraception", () => {
    render(<HomePage />);
    expect(screen.getByText("Can I use Luna to avoid pregnancy?")).toBeInTheDocument();
    expect(screen.getByText(/Calendar estimates are not reliable contraception/)).toBeInTheDocument();
  });

  it("speaks to people who menstruate and does not sell a conception mode", () => {
    render(<HomePage />);
    expect(screen.getByText(/period tracker for people who menstruate/)).toBeInTheDocument();
    expect(screen.queryByText(/every woman/)).toBeNull();
    expect(screen.getByText(/not a conception plan or a test/)).toBeInTheDocument();
  });

  it("says fertile window, ovulation and PMS stay off until asked", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Fertile window, ovulation and PMS days stay off until you ask/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Fertile window, estimated ovulation and PMS days if you ask to see them/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fertile days and PMS days if you ask/)).toBeInTheDocument();
  });

  it("says an account is Google only before the compare section", () => {
    render(<HomePage />);
    expect(screen.getByText(/An account, if you want one, is Google only/)).toBeInTheDocument();
  });

  it("points to Moon and tithi without putting it in the main pitch", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: "Moon and tithi" })).toHaveAttribute(
      "href",
      "/tracker/tithi",
    );
    expect(
      screen.getByText(/can show where those start days sat in the lunar month/),
    ).toBeInTheDocument();
  });
});
