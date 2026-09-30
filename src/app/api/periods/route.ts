import { NextResponse } from "next/server";
import { daysBetween, rangesOverlap } from "@/lib/dates";
import { requireSignedInUser } from "@/lib/current-user";
import { getSupabaseServer } from "@/lib/supabase";
import type { PeriodRecord } from "@/lib/tracker-types";

type PeriodRow = {
  id: string;
  start_date: string;
  end_date: string;
};

function asRecord(row: PeriodRow): PeriodRecord {
  return { id: row.id, startDate: row.start_date, endDate: row.end_date };
}

function invalidPeriod(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return "Please select both the start day and end day of bleeding.";
  }
  if (endDate < startDate) {
    return "The end day of bleeding cannot be before the start day.";
  }
  if (daysBetween(startDate, endDate) > 20) {
    return "Please check the dates. A period entry cannot exceed 20 days.";
  }
  return null;
}

export async function GET() {
  const user = await requireSignedInUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("periods")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    periods: (data ?? []).map((row) => asRecord(row as PeriodRow)),
  });
}

export async function POST(request: Request) {
  const user = await requireSignedInUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    startDate?: string;
    endDate?: string;
  };
  const startDate = body.startDate ?? "";
  const endDate = body.endDate ?? "";
  const problem = invalidPeriod(startDate, endDate);
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data: existing, error: existingError } = await supabase
    .from("periods")
    .select("id, start_date, end_date")
    .eq("user_id", user.id);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const overlaps = (existing ?? []).some((row) =>
    rangesOverlap(row.start_date, row.end_date, startDate, endDate),
  );
  if (overlaps) {
    return NextResponse.json(
      {
        error:
          "This overlaps another saved period. Update or remove that entry first.",
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("periods")
    .insert({
      user_id: user.id,
      start_date: startDate,
      end_date: endDate,
    })
    .select("id, start_date, end_date")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not save period." },
      { status: 500 },
    );
  }

  return NextResponse.json({ period: asRecord(data) });
}