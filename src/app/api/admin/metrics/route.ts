import { cookies } from "next/headers";
import { readAnalyzeMetrics } from "@/lib/metrics";

export async function GET(): Promise<Response> {
  const c = await cookies();
  const session = c.get("admin_session")?.value;
  if (session !== "1") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const data = await readAnalyzeMetrics(14);
  return Response.json(data, { status: 200 });
}


