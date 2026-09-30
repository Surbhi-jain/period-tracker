export type Profile =
  | { mode: "age"; age: number }
  | { mode: "dob"; dateOfBirth: string };

export type PeriodRecord = {
  id: string;
  startDate: string;
  endDate: string;
};

export function profileFromRow(row: {
  mode: string;
  age: number | null;
  date_of_birth: string | null;
}): Profile | null {
  if (row.mode === "age" && typeof row.age === "number") {
    return { mode: "age", age: row.age };
  }
  if (row.mode === "dob" && row.date_of_birth) {
    return { mode: "dob", dateOfBirth: row.date_of_birth };
  }
  return null;
}