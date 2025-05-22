import { OramaSearchButton, OramaSearchBox } from '@orama/react-components'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'
import { Box, useColorScheme } from '@mui/material'
import OramaIntegrationT from '../../interfacesAndTypes/integrations/OramaIntegrationI'
import testIDs from '../../interfacesAndTypes/testIDs'

export const OramaSearchIntegration = (config: OramaIntegrationT) => {
  const scheme = useColorScheme()

  if (!config.active) {
    return null
  }

  return (
    <Box
      sx={{
        width: {
          xs: '100%',
          sm: '75%',
          md: '50%',
          lg: '40%',
          xl: '30%',
        },
      }}
    >
      <OramaSearchButton
        size="large"
        colorScheme={scheme.colorScheme}
        themeConfig={{}}
        data-testid={testIDs.integrations.orama.searchButton}
      >
        {config.dictionary?.search_placeholder ?? 'Search something...'}
      </OramaSearchButton>
      <OramaSearchBox
        data-testid={testIDs.integrations.orama.searchBox}
        index={{
          endpoint: config.endpoint,
          api_key: config.api_key,
        }}
        colorScheme={scheme.colorScheme}
        disableChat={config.disable_chat}
        searchPlaceholder={config.dictionary?.search_placeholder}
        chatPlaceholder={config.dictionary?.chat_placeholder}
        suggestions={config.dictionary?.suggestions}
        facetProperty={config.facet_property as string | undefined}
        resultMap={{
          path: (doc) => {
            return sanitizeDocuUri(doc.path).href
          },
          description: 'content',
          title: 'title',
          section: 'category',
        }}
      />
    </Box>
  )
}

export default OramaSearchIntegration
