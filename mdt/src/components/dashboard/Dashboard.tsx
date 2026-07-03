import { messages } from "@/lib/i18n/messages";
import { BulletinBoard } from "./BulletinBoard";
import { RecentReports } from "./RecentReports";
import { ActiveWarrants } from "./ActiveWarrants";
import { UnitsTable } from "./UnitsTable";
import { BOLOs } from "./BOLOs";

export function Dashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-mdt-foreground">
          {messages.dashboard.title}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="lg:col-span-1">
          <BulletinBoard />
        </div>
        <div className="lg:col-span-1">
          <RecentReports />
        </div>
        <div className="lg:col-span-1">
          <ActiveWarrants />
        </div>
        <div className="lg:col-span-1 xl:col-span-1">
          <BOLOs />
        </div>
        <div className="col-span-full">
          <UnitsTable />
        </div>
      </div>
    </div>
  );
}
