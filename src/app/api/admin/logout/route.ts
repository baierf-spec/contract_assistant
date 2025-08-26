import { cookies } from "next/headers";

export async function POST(): Promise<Response> {
  const c = await cookies();
  c.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return Response.json({ ok: true }, { status: 200 });
}
