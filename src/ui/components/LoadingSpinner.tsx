import { Box, CircularProgress } from '@mui/material'
import testIDs from '../interfacesAndTypes/testIDs'

export const LoadingSpinner = () => (
  <Box
    sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}
    data-testid={testIDs.loadingIndicator}
  >
    <CircularProgress />
  </Box>
)
