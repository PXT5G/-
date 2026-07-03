import { MainLayout } from "@/components/layout/MainLayout";

export default function MdtShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
