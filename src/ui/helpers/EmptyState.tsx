import { Box, Typography, Button, SvgIcon } from '@mui/material'
import React from 'react'

interface EmptyStateVisualProps {
  title: string
  description?: string
  iconClass: React.ElementType
  onAction?: () => void
  actionText?: string
}

const EmptyState = (props: EmptyStateVisualProps) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="100%"
    >
      <SvgIcon component={props.iconClass} sx={{ fontSize: 150 }} />
      <Typography variant="h4" marginTop={2}>
        {props.title}
      </Typography>
      {props.description && (
        <Typography variant="body1" color="textSecondary" marginTop={1}>
          {props.description}
        </Typography>
      )}
      {props.onAction && props.actionText && (
        <Button variant="contained" color="primary" onClick={props.onAction} sx={{ marginTop: 3 }}>
          {props.actionText}
        </Button>
      )}
    </Box>
  )
}

export default EmptyState
