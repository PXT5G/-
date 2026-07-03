import { cn } from "@/lib/utils/cn";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export function Panel({ children, className, title, action }: PanelProps) {
  return (
    <section
      className={cn(
        "mdt-panel flex flex-col rounded-lg overflow-hidden",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-mdt-panel-border px-4 py-3">
          {title ? (
            <h2 className="text-sm font-semibold uppercase tracking-wider text-mdt-foreground">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}
