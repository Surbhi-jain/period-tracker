import { NextResponse } from "next/server";
import { daysBetween, rangesOverlap } from "@/lib/dates";
import { requireSignedInUser } from "@/lib/current-user";
import { getSupabaseServer } from "@/lib/supabase";

type PeriodRow = {
  id: string;
  start_date: string;
  end_date: string;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSignedInUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    startDate?: string;
    endDate?: string;
  };
  const startDate = body.startDate ?? "";
  const endDate = body.endDate ?? "";

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Please select both the start day and end day of bleeding." },
      { status: 400 },
    );
  }
  if (endDate < startDate) {
    return NextResponse.json(
      { error: "The end day of bleeding cannot be before the start day." },
      { status: 400 },
    );
  }
  if (daysBetween(startDate, endDate) > 20) {
    return NextResponse.json(
      {
        error:
          "Please check the dates. A period entry cannot exceed 20 days.",
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServer();
  const { data: existing, error: existingError } = await supabase
    .from("periods")
    .select("id, start_date, end_date")
    .eq("user_id", user.id);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const overlaps = (existing ?? []).some(
    (row) =>
      row.id !== id &&
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
    .update({ start_date: startDate, end_date: endDate })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, start_date, end_date")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const row = data as PeriodRow;
  return NextResponse.json({
    period: { id: row.id, startDate: row.start_date, endDate: row.end_date },
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSignedInUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("periods")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}