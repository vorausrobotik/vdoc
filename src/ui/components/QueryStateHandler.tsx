import { ReactElement, ReactNode } from 'react'
import { Box, CircularProgress, Alert, AlertTitle } from '@mui/material'

import { FastAPIAxiosErrorT } from '../interfacesAndTypes/Error'

interface QueryStateHandlerProps<T> {
  loading: boolean
  error: FastAPIAxiosErrorT | null
  data: T | undefined
  children: (data: T) => ReactElement
  loadingComponent?: ReactNode
}

const QueryStateHandler = <T,>({ loading, error, data, children, loadingComponent }: QueryStateHandlerProps<T>) => {
  if (loading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    const errorMessage = error.response?.data?.message ?? 'An unknown error occurred.'

    return (
      <Box display="flex" justifyContent="center" alignItems="center">
        <Alert severity="error" sx={{ minWidth: '100%' }}>
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      </Box>
    )
  }

  if (data) {
    return children(data)
  }

  return null
}

export default QueryStateHandler
