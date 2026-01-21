export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Admin has its own layout - no particles, no landing page navbar */}
      {children}
    </div>
  );
}
