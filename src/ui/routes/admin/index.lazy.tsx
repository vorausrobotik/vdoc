import { createLazyFileRoute } from '@tanstack/react-router'
import { AdminApp } from '@/admin/AdminApp'

// Lazy, so react-admin only reaches the browser of whoever opens the admin pages
export const Route = createLazyFileRoute('/admin/')({
  component: AdminApp,
})
