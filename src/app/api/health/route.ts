import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const timestamp = new Date().toISOString();
  let databaseOk = false;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );
    const { error } = await supabase
      .from("models")
      .select("id", { count: "exact", head: true })
      .limit(0);
    databaseOk = !error;
  } catch {
    databaseOk = false;
  }

  const status = databaseOk ? "ok" : "degraded";
  return Response.json(
    { status, timestamp, checks: { database: databaseOk } },
    { status: databaseOk ? 200 : 503 }
  );
}
