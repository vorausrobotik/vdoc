import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$projectName/')({
  loader: async ({ params }) => {
    const { projectName } = params
    throw redirect({
      to: `/${projectName}/versions/latest`,
    })
  },
})
