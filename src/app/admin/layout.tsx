import { headers } from 'next/headers'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import './admin-theme.css'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current path to check if we're on auth pages
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''
  const isAuthPage = pathname.includes('/login') || pathname.includes('/callback')

  // Auth pages get a simple centered layout without sidebar
  if (isAuthPage) {
    return (
      <div className="admin-theme min-h-screen bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
          {children}
        </div>
      </div>
    )
  }

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
