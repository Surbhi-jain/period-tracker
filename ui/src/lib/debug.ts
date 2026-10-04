const PREFIX = "[Luna]";

export function lunaDebug(scope: string, message: string, extra?: unknown) {
  if (process.env.NODE_ENV === "production") return;

  if (extra === undefined) {
    console.log(PREFIX, scope, message);
    return;
  }

  console.log(PREFIX, scope, message, extra);
}