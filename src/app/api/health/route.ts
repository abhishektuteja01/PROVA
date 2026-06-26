import { createClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
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
