import { createLazyFileRoute } from '@tanstack/react-router'
import { AdminApp } from '@/admin/AdminApp'

// Every page below /admin, which react-admin routes on its own
export const Route = createLazyFileRoute('/admin/$')({
  component: AdminApp,
})
