import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted mb-6">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/admin">Go to Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/clients">View Clients</Link>
        </Button>
      </div>
    </div>
  )
}
