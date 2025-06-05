import { OramaSearchButton, OramaSearchBox } from '@orama/react-components'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'
import { Box, useColorScheme } from '@mui/material'
import OramaPluginT from '../../interfacesAndTypes/plugins/OramaPluginT'
import testIDs from '../../interfacesAndTypes/testIDs'

export const OramaSearchPlugin = (config: OramaPluginT) => {
  const scheme = useColorScheme()

  if (!config.active) {
    return null
  }

  const configurationDict = {
    searchPlaceholder: config.dictionary?.search_placeholder,
    chatPlaceholder: config.dictionary?.chat_placeholder,
    disclaimer: config.dictionary?.disclaimer,
  }

  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <OramaSearchButton
        size="large"
        colorScheme={scheme.colorScheme}
        themeConfig={{}}
        dictionary={configurationDict}
        data-testid={testIDs.plugins.orama.searchButton}
      >
        {config.dictionary?.search_placeholder ?? 'Search something...'}
      </OramaSearchButton>
      <OramaSearchBox
        data-testid={testIDs.plugins.orama.searchBox}
        index={{
          endpoint: config.endpoint,
          api_key: config.api_key,
        }}
        suggestions={config.dictionary?.suggestions}
        colorScheme={scheme.colorScheme}
        disableChat={config.disable_chat}
        dictionary={configurationDict}
        facetProperty={config.facet_property as string | undefined}
        chatMarkdownLinkHref={({ href }) => {
          try {
            // Orama sometimes returns relative URLs prefixed with http:// or https://
            // We need to remove these prefixes to properly sanitize the URL.
            for (const word of ['http://', 'https://']) {
              href = href.replace(word, '')
            }
            return sanitizeDocuUri(href).href
          } catch {
            return href
          }
        }}
        resultMap={{
          path: (doc) => {
            return sanitizeDocuUri(doc.path).href
          },
          description: 'content',
          title: 'title',
          section: 'category',
        }}
        sourceBaseUrl={window.origin}
      />
    </Box>
  )
}

export default OramaSearchPlugin
