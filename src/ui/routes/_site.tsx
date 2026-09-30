import { createFileRoute } from '@tanstack/react-router'
import { SiteLayout } from '../components/RootLayout'

export const Route = createFileRoute('/_site')({
  component: SiteLayout,
})
