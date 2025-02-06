import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { FastAPIAxiosErrorT } from '../interfacesAndTypes/Error'
import { Box } from '@mui/material'
import EmptyState from './EmptyState'
import SearchOffIcon from '@mui/icons-material/SearchOff'

interface ErrorComponentProps extends React.ComponentProps<'div'> {
  error: FastAPIAxiosErrorT
  timerMs?: number
  actionText?: string
}

export const ErrorComponent = ({ error, timerMs = 10000, actionText = 'Go back' }: ErrorComponentProps) => {
  const [timer, setTimer] = useState(10)
  const router = useRouter()

  const handleGoBack = useCallback(() => {
    router.history.back()
  }, [router])

  useEffect(() => {
    if (timerMs) {
      if (timer > 0) {
        const timerId = setInterval(() => {
          setTimer((prev) => prev - 1)
        }, timerMs)

        return () => clearInterval(timerId)
      } else {
        handleGoBack()
      }
    }
  }, [timer, handleGoBack, timerMs])

  const errorMessage = error.response?.data?.message ?? 'An unknown error occurred.'

  const getDescription = (): string | undefined => {
    return timerMs ? `Returning to previous page in ${timer} second${timer <= 1 ? '' : 's'}...` : undefined
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
      <EmptyState
        title={errorMessage}
        titleVariant="h5"
        description={getDescription()}
        iconClass={SearchOffIcon}
        iconFontSize={100}
        iconColor="warning"
        actionText={actionText}
        onAction={handleGoBack}
      />
    </Box>
  )
}

export default ErrorComponent
