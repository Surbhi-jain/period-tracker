export const NO_STORE = { "Cache-Control": "no-store" } as const;

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE });
}

export function jsonError(error: string, status: number) {
  return json({ error }, status);
}

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
