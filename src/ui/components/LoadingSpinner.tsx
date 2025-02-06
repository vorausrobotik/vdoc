import testIDs from '../interfacesAndTypes/testIDs'
import { Box, CircularProgress } from '@mui/material'

export const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2 }} data-testid={testIDs.loadingIndicator}>
    <CircularProgress />
  </Box>
)

export default LoadingSpinner
