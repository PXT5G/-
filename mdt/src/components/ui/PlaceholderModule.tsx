import { messages } from "@/lib/i18n/messages";

interface PlaceholderModuleProps {
  title: string;
}

export function PlaceholderModule({ title }: PlaceholderModuleProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-mdt-foreground">{title}</h1>
      <div className="mdt-panel rounded-lg p-8 text-center text-mdt-muted">
        <p className="text-sm">{messages.common.loading}</p>
        <p className="mt-2 text-xs">
          Module scaffold — connect Discord Bot API endpoints for this section.
        </p>
      </div>
    </div>
  );
}
