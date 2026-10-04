import { Hono } from "hono";
import { periodFromRow } from "@luna/shared/validation";
import { databaseError, withAccount, type AccountDeps } from "../account";
import { json } from "../http";
import { lunaDebug } from "../debug";

export function accountRoutes(deps: AccountDeps) {
  const routes = new Hono();

  routes.get("/", (c) =>
    withAccount(c, "api/account GET", deps, async ({ user, supabase }) => {
      const periodsResult = await supabase
        .from("periods")
        .select("id, start_date, end_date")
        .eq("email", user.email)
        .order("start_date", { ascending: true });

      if (periodsResult.error) {
        return databaseError("api/account GET", periodsResult.error.message);
      }

      return json({
        exportedAt: new Date().toISOString(),
        account: user.email,
        periods: (periodsResult.data ?? []).map(periodFromRow),
      });
    }),
  );

  routes.delete("/", (c) =>
    withAccount(c, "api/account DELETE", deps, async ({ user, supabase }) => {
      const periods = await supabase.from("periods").delete().eq("email", user.email);
      if (periods.error) return databaseError("api/account DELETE", periods.error.message);

      lunaDebug("api/account DELETE", "all data removed");
      return json({ ok: true });
    }),
  );

  return routes;
}
