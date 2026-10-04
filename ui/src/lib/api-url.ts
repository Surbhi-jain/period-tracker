export function apiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
