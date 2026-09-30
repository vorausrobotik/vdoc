import { createFileRoute } from '@tanstack/react-router'
import { DocumentationComponent } from '@/components/DocumentationComponent'

/**
 * A single documentation page.
 *
 * Deliberately without a loader: this route's params carry the page, and every page change - which
 * for single page documentation happens without a document load - would otherwise re-run it. What
 * has to be resolved for the whole project version is resolved by the route above.
 */
export const Route = createFileRoute('/_site/$projectName/$version/$')({
  component: DocumentationComponent,
})
