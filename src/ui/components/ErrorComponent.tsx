import { useState, useEffect, ElementType } from 'react'
import { AxiosError } from 'axios'
import { Box, Typography, Button, SvgIcon } from '@mui/material'
import type { TypographyVariant } from '@mui/material/styles'
import { SvgIconProps } from '@mui/material/SvgIcon'
import { BoxProps } from '@mui/system'
import testIDs from '../interfacesAndTypes/testIDs'

type SvgIconColor = SvgIconProps['color']

interface ErrorComponentVisualProps extends BoxProps {
  error?: AxiosError | Error
  timerSeconds?: number
  actionText?: string
  title?: string
  titleVariant?: TypographyVariant
  description?: string
  descriptionVariant?: TypographyVariant
  iconClass: ElementType
  iconColor?: SvgIconColor
  iconFontSize?: number
  onAction?: () => void
}

const ErrorComponent = ({
  error,
  title,
  titleVariant = 'h4',
  description,
  descriptionVariant = 'body1',
  iconClass,
  iconFontSize = 150,
  iconColor,
  onAction,
  timerSeconds = 5,
  actionText = 'Go back',
  ...boxProps
}: ErrorComponentVisualProps) => {
  const [timer, setTimer] = useState(timerSeconds)

  useEffect(() => {
    if (timerSeconds && onAction) {
      if (timer > 0) {
        const timerId = setInterval(() => {
          setTimer((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timerId)
      } else {
        onAction()
      }
    }
  }, [timer, onAction, timerSeconds])

  const getErrorMessage = (error: AxiosError | Error | undefined, title: string | undefined) => {
    if (error) {
      if (error instanceof AxiosError) {
        return error.response?.data?.message
      }
      return error.message ?? 'An unknown error occurred.'
    } else if (title) {
      return title
    }
    return 'An unknown error occurred.'
  }

  const getDescription = (): string | undefined => {
    return timerSeconds ? `Returning to previous page in ${timer} second${timer === 1 ? '' : 's'}...` : undefined
  }
  return (
    <Box
      sx={boxProps.sx}
      data-testid={testIDs.errorComponent.main}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="100%"
    >
      <SvgIcon
        data-testid={testIDs.errorComponent.icon}
        component={iconClass}
        color={iconColor}
        sx={{ fontSize: iconFontSize }}
      />
      <Typography variant={titleVariant} marginTop={2} data-testid={testIDs.errorComponent.title}>
        {getErrorMessage(error, title)}
      </Typography>
      <Typography
        variant={descriptionVariant}
        color="textSecondary"
        marginTop={1}
        data-testid={testIDs.errorComponent.description}
      >
        {description ?? getDescription()}
      </Typography>
      {onAction && actionText && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          sx={{ marginTop: 3 }}
          data-testid={testIDs.errorComponent.actionButton}
        >
          {actionText}
        </Button>
      )}
    </Box>
  )
}

export default ErrorComponent
