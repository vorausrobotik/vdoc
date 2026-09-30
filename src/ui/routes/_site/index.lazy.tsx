import { createLazyFileRoute } from '@tanstack/react-router'

import { LandingPage } from '../../components/LandingPage'

export const Route = createLazyFileRoute('/_site/')({
  component: LandingPage,
})
