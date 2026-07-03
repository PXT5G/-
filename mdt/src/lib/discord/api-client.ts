/**
 * عميل Discord Bot API — باكند PlayStation MDT Web فقط
 * FiveM (fivem-mdt-nui) لا يستخدم هذا المسار
 */

const API_URL = process.env.DISCORD_BOT_API_URL?.replace(/\/$/, "");
const API_SECRET = process.env.DISCORD_BOT_API_SECRET ?? "";

export function isDiscordBotConfigured(): boolean {
  return Boolean(API_URL && API_SECRET);
}

interface BotFetchOptions {
  method?: string;
  body?: unknown;
}

export async function botFetch<T>(
  path: string,
  options: BotFetchOptions = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!isDiscordBotConfigured()) {
    return { ok: false, error: "NOT_CONFIGURED" };
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP_${res.status}` };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: "UNREACHABLE" };
  }
}
