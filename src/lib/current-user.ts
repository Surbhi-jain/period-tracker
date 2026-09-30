import { auth } from "@/auth";

export async function requireSignedInUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return {
    id: userId,
    email: session.user.email ?? null,
  };
}