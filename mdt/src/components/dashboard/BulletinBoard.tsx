import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import { bulletinNotes } from "@/lib/data/mock";

export function BulletinBoard() {
  return (
    <Panel title={messages.dashboard.bulletinBoard} className="h-full min-h-[220px]">
      {bulletinNotes.length === 0 ? (
        <p className="text-sm text-mdt-muted">{messages.dashboard.noNotes}</p>
      ) : (
        <ul className="space-y-3">
          {bulletinNotes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-mdt-panel-border bg-slate-900/50 p-3"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-mdt-foreground">{note.title}</h3>
                <time className="shrink-0 text-[10px] text-mdt-muted" dateTime={note.createdAt}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </time>
              </div>
              <p className="text-xs leading-relaxed text-mdt-muted">{note.body}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-neon-blue">
                {note.author}
              </p>
            </li>
          ))}
        </ul>
      )}
      {/* Discord Bot API: GET /bulletins — fetch announcements from Discord-backed store */}
    </Panel>
  );
}
