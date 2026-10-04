import { Hono } from "hono";
import { withAccount, type AccountDeps } from "../account";
import { json, jsonError } from "../http";

export function profileRoutes(deps: AccountDeps) {
  const routes = new Hono();

  routes.get("/", (c) =>
    withAccount(c, "api/profile GET", deps, async () => json({ profile: null })),
  );

  routes.put("/", (c) =>
    withAccount(c, "api/profile PUT", deps, async () =>
      jsonError("Luna does not collect age.", 410),
    ),
  );

  return routes;
}
