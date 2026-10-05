import { Box, Button, Link } from '@mui/material'
import Markdown, { type Components } from 'react-markdown'
import { useBrand } from '@/brands/Brand'
import { PROJECTS_SECTION_ID, projectTitle } from '@/helpers/Projects'
import { LinkButton } from '@/interfacesAndTypes/LinkButton'
import type { Project } from '@/interfacesAndTypes/Project'
import type SitePluginT from '@/interfacesAndTypes/plugins/SitePlugin'
import testIDs from '@/interfacesAndTypes/testIDs'

/**
 * What the long description may render.
 *
 * Restricted rather than open: the hero owns its own type hierarchy, and a heading or an image
 * dropped into the configuration would fight it. Anything else is unwrapped rather than removed, so
 * unsupported markup degrades to its text instead of vanishing.
 */
const ALLOWED_ELEMENTS = ['p', 'a', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'br']

const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <Link
      href={href}
      // Only an absolute URL leaves the site, and only that should take over a new tab
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
    >
      {children}
    </Link>
  ),
}

type Props = { config: SitePluginT | null; projects: Project[] }

/** What this instance of vdoc is, above the projects it serves, in the brand's hero. */
export const SitePlugin = ({ config, projects }: Props) => {
  const { Hero, primaryButton } = useBrand()
  if (config == null || !config.active || !config.show_on_landing_page) {
    return null
  }
  // Only listed projects reach the landing page, so a featured project that is hidden offers no button
  const featured = projects.find((project) => project.featured)

  return (
    <Hero
      data-testid={testIDs.plugins.site.main}
      title={config.title && <span data-testid={testIDs.plugins.site.title}>{config.title}</span>}
      lead={config.description && <span data-testid={testIDs.plugins.site.description}>{config.description}</span>}
      actions={
        featured && (
          <>
            <LinkButton
              data-testid={testIDs.plugins.site.featuredProject}
              variant={primaryButton}
              to="/$projectName/$version/$"
              params={{ projectName: featured.name, version: 'latest', _splat: '' }}
            >
              {featured.featured_label ?? `Start with ${projectTitle(featured)}`}
            </LinkButton>
            <Button
              variant="outlined"
              onClick={() => document.getElementById(PROJECTS_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' })}
            >
              All projects
            </Button>
          </>
        )
      }
    >
      {config.long_description && config.long_description.length > 0 && (
        <LongDescription lines={config.long_description} />
      )}
    </Hero>
  )
}

function LongDescription({ lines }: { lines: string[] }) {
  return (
    <Box
      data-testid={testIDs.plugins.site.longDescription}
      sx={{
        mt: 2,
        maxWidth: '90ch',
        color: 'text.secondary',
        lineHeight: 1.7,
        fontSize: { xs: '0.95rem', md: '1.0625rem' },
        '& p': { m: 0 },
        '& p + p, & p + ul, & p + ol, & ul + p, & ol + p': { mt: 1.5 },
        '& ul, & ol': { my: 0, pl: 3 },
        '& li + li': { mt: 0.25 },
        '& code': {
          px: 0.5,
          borderRadius: 0.5,
          bgcolor: 'action.hover',
          fontFamily: 'monospace',
          fontSize: '0.9em',
        },
      }}
    >
      <Markdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed components={MARKDOWN_COMPONENTS}>
        {lines.join('\n')}
      </Markdown>
    </Box>
  )
}
