import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import type { Officer } from "@/types";
import { cn } from "@/lib/utils/cn";

interface OfficerCardProps {
  officer: Officer;
}

export function OfficerCard({ officer }: OfficerCardProps) {
  const onDuty = officer.dutyStatus === "on_duty";

  return (
    <article
      className={cn(
        "mdt-panel rounded-lg p-4 transition-colors",
        onDuty ? "border-neon-green/20" : "border-neon-red/10",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-mdt-foreground">{officer.name}</h3>
          <p className="text-xs text-mdt-muted">
            {officer.rank} · {officer.department}
          </p>
        </div>
        <StatusBadge
          label={onDuty ? messages.profile.onDuty : messages.profile.offDuty}
          variant={onDuty ? "green" : "red"}
        />
      </div>

      {officer.callsign && (
        <p className="mb-2 font-mono text-xs text-neon-blue">{officer.callsign}</p>
      )}

      <p className="text-xs text-mdt-muted">
        {messages.officers.hours}:{" "}
        <span className="font-semibold text-mdt-foreground">{officer.hours}</span>
      </p>

      {officer.badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="sr-only">{messages.officers.specialization}</span>
          {officer.badges.map((badge) => (
            <span
              key={badge}
              className="rounded border border-neon-blue/30 bg-neon-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neon-blue"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
