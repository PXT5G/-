import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guards";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: session.sub,
      username: session.username,
      role: session.role,
      permissions: session.permissions,
      officer: session.officer,
    },
  });
}
