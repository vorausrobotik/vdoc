import { Box, Typography, Button, SvgIcon } from '@mui/material'
import type { Variant } from '@mui/material/styles/createTypography'
import { SvgIconProps } from '@mui/material/SvgIcon'

type SvgIconColor = SvgIconProps['color']

import React from 'react'

interface EmptyStateVisualProps {
  title: string
  titleVariant?: Variant
  description?: string
  descriptionVariant?: Variant
  iconClass: React.ElementType
  iconColor: SvgIconColor
  iconFontSize?: number
  onAction?: () => void
  actionText?: string
}

const EmptyState = ({
  title,
  titleVariant = 'h4',
  description,
  descriptionVariant = 'body1',
  iconClass,
  iconFontSize = 150,
  iconColor = 'inherit',
  onAction,
  actionText,
}: EmptyStateVisualProps) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="100%"
    >
      <SvgIcon component={iconClass} color={iconColor} sx={{ fontSize: iconFontSize }} />
      <Typography variant={titleVariant} marginTop={2}>
        {title}
      </Typography>
      {description && (
        <Typography variant={descriptionVariant} color="textSecondary" marginTop={1}>
          {description}
        </Typography>
      )}
      {onAction && actionText && (
        <Button variant="contained" color="primary" onClick={onAction} sx={{ marginTop: 3 }}>
          {actionText}
        </Button>
      )}
    </Box>
  )
}

export default EmptyState
