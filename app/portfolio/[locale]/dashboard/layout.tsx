import { auth } from "@/lib/portfolio/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/portfolio/DashboardShell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/portfolio/${locale}/login`);

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </DashboardShell>
  );
}
