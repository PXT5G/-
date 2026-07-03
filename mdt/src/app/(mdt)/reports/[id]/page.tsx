import { ReportTabs } from "@/components/reports/ReportTabs";
import { messages } from "@/lib/i18n/messages";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-mdt-foreground">
          {messages.reports.title}
        </h1>
        <p className="mt-1 font-mono text-sm text-neon-blue">{id}</p>
      </header>
      <ReportTabs reportId={id} />
    </div>
  );
}
