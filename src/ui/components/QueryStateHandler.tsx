import { ReactElement, ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'
import ErrorComponent from './ErrorComponent'
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
    return loadingComponent ? <>{loadingComponent}</> : <LoadingSpinner />
  }

  if (error) {
    return <ErrorComponent error={error} />
  }

  if (data) {
    return children(data)
  }

  return null
}

export default QueryStateHandler
