import { Hono } from "hono";
import { latestAllowedDate } from "@luna/shared/dates";
import {
  isUuid,
  MAX_PERIODS_PER_ACCOUNT,
  PERIOD_ERROR,
  periodFromRow,
  periodOverlaps,
  validatePeriodInput,
} from "@luna/shared/validation";
import { databaseError, withAccount, type AccountDeps } from "../account";
import { json, jsonError, readJsonObject } from "../http";
import { lunaDebug } from "../debug";

const NOT_FOUND = "Entry not found.";

export function periodRoutes(deps: AccountDeps) {
  const routes = new Hono();

  routes.get("/", (c) =>
    withAccount(c, "api/periods GET", deps, async ({ user, supabase }) => {
      const { data, error } = await supabase
        .from("periods")
        .select("id, start_date, end_date")
        .eq("email", user.email)
        .order("start_date", { ascending: false });

      if (error) return databaseError("api/periods GET", error.message);

      lunaDebug("api/periods GET", "success", { count: data?.length ?? 0 });
      return json({ periods: (data ?? []).map(periodFromRow) });
    }),
  );

  routes.post("/", (c) =>
    withAccount(c, "api/periods POST", deps, async ({ user, supabase }) => {
      const body = await readJsonObject(c.req.raw);
      if (!body) return jsonError("Invalid request.", 400);

      const { startDate, endDate } = body;
      const problem = validatePeriodInput(startDate, endDate, {
        today: latestAllowedDate(),
      });
      if (problem) {
        lunaDebug("api/periods POST", "validation failed", problem);
        return jsonError(problem, 400);
      }
      const start = startDate as string;
      const end = endDate as string;

      const { data: existing, error: existingError } = await supabase
        .from("periods")
        .select("id, start_date, end_date")
        .eq("email", user.email);

      if (existingError) return databaseError("api/periods POST", existingError.message);

      const saved = (existing ?? []).map(periodFromRow);
      if (saved.length >= MAX_PERIODS_PER_ACCOUNT) {
        return jsonError("You have reached the maximum number of saved periods.", 400);
      }
      if (periodOverlaps(start, end, saved)) {
        lunaDebug("api/periods POST", "overlap rejected", { start, end });
        return jsonError(PERIOD_ERROR.overlap, 400);
      }

      const { data, error } = await supabase
        .from("periods")
        .insert({ email: user.email, start_date: start, end_date: end })
        .select("id, start_date, end_date")
        .single();

      if (error || !data) {
        return databaseError("api/periods POST", error?.message ?? "No row returned");
      }

      lunaDebug("api/periods POST", "success", { id: data.id });
      return json({ period: periodFromRow(data) });
    }),
  );

  routes.put("/:id", (c) =>
    withAccount(c, "api/periods/[id] PUT", deps, async ({ user, supabase }) => {
      const id = c.req.param("id");
      if (!isUuid(id)) return jsonError(NOT_FOUND, 404);

      const body = await readJsonObject(c.req.raw);
      if (!body) return jsonError("Invalid request.", 400);

      const { startDate, endDate } = body;
      const problem = validatePeriodInput(startDate, endDate, {
        today: latestAllowedDate(),
      });
      if (problem) return jsonError(problem, 400);
      const start = startDate as string;
      const end = endDate as string;

      const { data: existing, error: existingError } = await supabase
        .from("periods")
        .select("id, start_date, end_date")
        .eq("email", user.email);

      if (existingError) {
        return databaseError("api/periods/[id] PUT", existingError.message);
      }

      if (periodOverlaps(start, end, (existing ?? []).map(periodFromRow), id)) {
        return jsonError(PERIOD_ERROR.overlap, 400);
      }

      const { data, error } = await supabase
        .from("periods")
        .update({ start_date: start, end_date: end })
        .eq("id", id)
        .eq("email", user.email)
        .select("id, start_date, end_date")
        .maybeSingle();

      if (error) return databaseError("api/periods/[id] PUT", error.message);
      if (!data) return jsonError(NOT_FOUND, 404);

      lunaDebug("api/periods/[id] PUT", "success", { id });
      return json({ period: periodFromRow(data) });
    }),
  );

  routes.delete("/:id", (c) =>
    withAccount(c, "api/periods/[id] DELETE", deps, async ({ user, supabase }) => {
      const id = c.req.param("id");
      if (!isUuid(id)) return jsonError(NOT_FOUND, 404);

      const { data, error } = await supabase
        .from("periods")
        .delete()
        .eq("id", id)
        .eq("email", user.email)
        .select("id")
        .maybeSingle();

      if (error) return databaseError("api/periods/[id] DELETE", error.message);
      if (!data) return jsonError(NOT_FOUND, 404);

      lunaDebug("api/periods/[id] DELETE", "success", { id });
      return json({ ok: true });
    }),
  );

  return routes;
}
