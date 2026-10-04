import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoogleAuth } from "./google-auth";

const useSession = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  useSession: () => useSession(),
  signIn: vi.fn(),
  signOut: (args: unknown) => signOut(args),
}));

describe("GoogleAuth", () => {
  it("keeps the signed-in name and Sign out in an account menu", () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Surbhi J", email: "a@b.c" } },
    });

    render(<GoogleAuth />);

    expect(screen.getByLabelText("Account, Surbhi J")).toBeInTheDocument();
    expect(screen.getByText("Surbhi J")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Surbhi J" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/" });
  });
});
