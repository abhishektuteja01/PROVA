import { createServerClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/errors/messages";

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse("AUTH_REQUIRED");

  return Response.json({ error: "Not implemented" }, { status: 501 });
}
