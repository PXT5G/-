import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth/guards";
import {
  appendAudit,
  getSystemSettings,
  updateSystemSettings,
} from "@/lib/auth/user-store";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ settings: getSystemSettings() });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const settings = updateSystemSettings(body);
    appendAudit({
      actorId: session.sub,
      actorName: session.officer.name,
      action: "SETTINGS_UPDATED",
      details: JSON.stringify(body),
    });
    return NextResponse.json({ settings });
  } catch (err) {
    return authErrorResponse(err);
  }
}
