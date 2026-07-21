import { Button, type ButtonProps } from '@mui/material'
import { createLink, type LinkComponent } from '@tanstack/react-router'
import * as React from 'react'

const MUILinkComponent = React.forwardRef<HTMLAnchorElement, ButtonProps>((props, ref) => {
  return <Button component={'a'} ref={ref} {...props} />
})

const CreatedLinkComponent = createLink(MUILinkComponent)

export const LinkButton: LinkComponent<typeof MUILinkComponent> = (props) => {
  return <CreatedLinkComponent {...props} />
}
