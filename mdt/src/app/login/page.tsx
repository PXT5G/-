import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { messages } from "@/lib/i18n/messages";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-mdt-muted">{messages.common.loading}</div>}>
      <LoginForm />
    </Suspense>
  );
}
