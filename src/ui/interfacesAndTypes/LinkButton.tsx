import * as React from 'react'
import { createLink, LinkComponent } from '@tanstack/react-router'
import { Button, ButtonProps } from '@mui/material'

const MUILinkComponent = React.forwardRef<HTMLAnchorElement, ButtonProps>((props, ref) => {
  return <Button component={'a'} ref={ref} {...props} />
})

const CreatedLinkComponent = createLink(MUILinkComponent)

export const LinkButton: LinkComponent<typeof MUILinkComponent> = (props) => {
  return <CreatedLinkComponent {...props} />
}
