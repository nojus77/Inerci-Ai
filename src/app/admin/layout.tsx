import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import './admin-theme.css'

export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      <div className="flex h-screen overflow-hidden bg-muted/20">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
