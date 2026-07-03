import { NextRequest, NextResponse } from "next/server";
import {
  authErrorResponse,
  requireAdmin,
} from "@/lib/auth/guards";
import {
  appendAudit,
  createAccount,
  deleteAccount,
  getAllAccounts,
  updateAccount,
} from "@/lib/auth/user-store";
import { ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

export async function GET() {
  try {
    await requireAdmin();
    const accounts = getAllAccounts().map(({ passwordHash: _, ...rest }) => rest);
    return NextResponse.json({ accounts });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const account = createAccount({
      username: body.username,
      password: body.password,
      officer: body.officer,
      role: body.role as UserRole,
      permissions: body.permissions ?? ROLE_PERMISSIONS[body.role as UserRole],
      active: body.active ?? true,
    });
    appendAudit({
      actorId: session.sub,
      actorName: session.officer.name,
      action: "ACCOUNT_CREATED",
      target: account.username,
    });
    const { passwordHash: _, ...safe } = account;
    return NextResponse.json({ account: safe }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "USERNAME_EXISTS") {
      return NextResponse.json({ error: "USERNAME_EXISTS" }, { status: 409 });
    }
    return authErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const updated = updateAccount(body.id, {
      username: body.username,
      role: body.role,
      permissions: body.permissions,
      active: body.active,
      officer: body.officer,
      password: body.password,
    });
    if (!updated) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    appendAudit({
      actorId: session.sub,
      actorName: session.officer.name,
      action: "ACCOUNT_UPDATED",
      target: updated.username,
      details: body.password ? "Password reset" : undefined,
    });
    const { passwordHash: _, ...safe } = updated;
    return NextResponse.json({ account: safe });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    if (id === session.sub) {
      return NextResponse.json({ error: "CANNOT_DELETE_SELF" }, { status: 400 });
    }
    const ok = deleteAccount(id);
    if (!ok) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    appendAudit({
      actorId: session.sub,
      actorName: session.officer.name,
      action: "ACCOUNT_DELETED",
      target: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}
