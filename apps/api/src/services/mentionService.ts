const MENTION_REGEX = /@([a-zA-Z0-9_]{3,30})/g;

export function extractMentions(body: string): string[] {
  const mentions = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_REGEX.source, 'g');
  while ((match = regex.exec(body)) !== null) {
    mentions.add(match[1].toLowerCase());
  }
  return Array.from(mentions);
}

export function formatMentions(body: string, usernames: Record<string, string>): string {
  return body.replace(MENTION_REGEX, (_, username: string) => {
    const display = usernames[username.toLowerCase()] ?? username;
    return `@${display}`;
  });
}

export function hasMention(body: string, username: string): boolean {
  return extractMentions(body).includes(username.toLowerCase());
}
