import { Card, type CardProps } from '@mui/material'
import { createLink, type LinkComponent } from '@tanstack/react-router'
import * as React from 'react'

const MUICardLinkComponent = React.forwardRef<HTMLAnchorElement, CardProps<'a'>>((props, ref) => {
  return <Card component="a" ref={ref} {...props} />
})

const CreatedLinkComponent = createLink(MUICardLinkComponent)

/** A card that is a link as a whole, such as a tile. */
export const LinkCard: LinkComponent<typeof MUICardLinkComponent> = (props) => {
  return <CreatedLinkComponent {...props} />
}
