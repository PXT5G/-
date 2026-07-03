import { messages } from "@/lib/i18n/messages";
import { UnitsChannels } from "@/components/dispatch/UnitsChannels";
import { MapPlaceholder } from "@/components/dispatch/MapPlaceholder";
import { RecentIncidents } from "@/components/dispatch/RecentIncidents";

export default function DispatchPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-mdt-foreground">
          {messages.dispatch.title}
        </h1>
      </header>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <UnitsChannels />
        </div>
        <div className="xl:col-span-6">
          <MapPlaceholder />
        </div>
        <div className="xl:col-span-3">
          <RecentIncidents />
        </div>
      </div>
    </div>
  );
}
