"use client";

import { useState } from "react";
import { Lock, Shield, User } from "lucide-react";
import { messages } from "@/lib/i18n/messages";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils/cn";

export function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    if (!result.ok) setError(result.error ?? messages.common.error);
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mdt-bg p-4">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neon-blue/5 via-transparent to-mdt-bg" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-blue/40 bg-neon-blue/10 mdt-glow-blue">
            <Shield className="h-8 w-8 text-neon-blue" />
          </div>
          <span className="mb-2 inline-block rounded-full border border-neon-green/30 bg-neon-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neon-green">
            {messages.auth.badge}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-mdt-foreground">
            {messages.auth.loginTitle}
          </h1>
          <p className="mt-1 text-sm text-mdt-muted">{messages.auth.loginSubtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mdt-panel rounded-2xl border border-mdt-panel-border p-6 shadow-2xl"
        >
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-neon-red"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-semibold text-mdt-muted"
              >
                {messages.auth.username}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mdt-muted" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-mdt-panel-border bg-slate-950 py-3 ps-10 pe-3 text-sm text-mdt-foreground outline-none transition-colors focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/30"
                  placeholder="jcarter"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-mdt-muted"
              >
                {messages.auth.password}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mdt-muted" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-mdt-panel-border bg-slate-950 py-3 ps-10 pe-3 text-sm text-mdt-foreground outline-none transition-colors focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/30"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-6 w-full rounded-lg border border-neon-blue/40 bg-neon-blue/15 py-3 text-sm font-bold text-neon-blue transition-all hover:bg-neon-blue/25 mdt-glow-blue disabled:opacity-50",
            )}
          >
            {loading ? messages.auth.loggingIn : messages.auth.loginButton}
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-mdt-muted">
            <Lock className="h-3 w-3" />
            {messages.auth.secureNotice}
          </p>
        </form>

        <div className="mt-6 mdt-panel rounded-xl p-4 text-xs text-mdt-muted">
          <p className="mb-2 font-semibold text-mdt-foreground">{messages.auth.demoAccounts}</p>
          <ul className="space-y-1 font-mono text-[11px]">
            <li>admin / Admin@2026!</li>
            <li>jcarter / Lspd@1234</li>
            <li>tbradley / Command@1234</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
