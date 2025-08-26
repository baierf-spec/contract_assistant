import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest): Promise<Response> {
  const { password } = (await req.json()) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) {
    return Response.json({ error: "admin_not_configured" }, { status: 500 });
  }
  if ((password || "") !== expected) {
    return Response.json({ error: "invalid" }, { status: 401 });
  }
  const c = await cookies();
  c.set("admin_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return Response.json({ ok: true }, { status: 200 });
}


