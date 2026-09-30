import { NextResponse } from "next/server";
import { requireSignedInUser } from "@/lib/current-user";
import { getSupabaseServer } from "@/lib/supabase";
import { profileFromRow, type Profile } from "@/lib/tracker-types";

export async function GET() {
  const user = await requireSignedInUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("mode, age, date_of_birth")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ? profileFromRow(data) : null });
}

export async function PUT(request: Request) {
  const user = await requireSignedInUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as Profile;
  if (body.mode === "age") {
    if (!Number.isInteger(body.age) || body.age < 13 || body.age > 100) {
      return NextResponse.json(
        { error: "Please enter an age between 13 and 100." },
        { status: 400 },
      );
    }
  } else if (body.mode === "dob") {
    if (!body.dateOfBirth) {
      return NextResponse.json(
        { error: "Please enter a valid date of birth." },
        { status: 400 },
      );
    }
  } else {
    return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    email: user.email,
    mode: body.mode,
    age: body.mode === "age" ? body.age : null,
    date_of_birth: body.mode === "dob" ? body.dateOfBirth : null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: body });
}