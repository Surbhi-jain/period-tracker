import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HEALTH_DISCLAIMER } from "@/lib/site";
import PrivacyPage from "./page";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("privacy page", () => {
  it("uses the shared page hero, cards, and health warning", () => {
    render(<PrivacyPage />);

    expect(screen.getByText("PRIVACY")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Your data, in plain words" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What Luna stores" })).toBeInTheDocument();
    expect(screen.getByText("The start day and end day of each period you log.")).toBeInTheDocument();
    expect(screen.queryByText(/age or date of birth/i)).toBeNull();
    expect(screen.getByText(/When you sign in/)).toBeInTheDocument();
    expect(screen.queryByText(/your profile and periods/i)).toBeNull();
    expect(screen.getAllByText(HEALTH_DISCLAIMER).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Journal" })[0]).toHaveAttribute("href", "/blog");
  });
});
