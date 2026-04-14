import testIDs from '../interfacesAndTypes/testIDs'
import { Box, CircularProgress } from '@mui/material'

export const LoadingSpinner = () => (
  <Box
    sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}
    data-testid={testIDs.loadingIndicator}
  >
    <CircularProgress />
  </Box>
)

export default LoadingSpinner
