import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";

export async function PUT(req: NextRequest) {
  try {
    await requirePermission("criminal_code");
    const body = await req.json();
    // Discord Bot API: PUT /criminal-code — persist live charge edits
    console.info("[MDT] Charges updated:", body.charges?.length);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
}
