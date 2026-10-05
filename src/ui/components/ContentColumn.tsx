import { Container, type ContainerProps } from '@mui/material'
import { useBrand } from '@/brands/Brand'

/**
 * The column the landing page holds its content in, as wide as the brand sets it.
 *
 * The gutters come on top of that width, so that content in here lines up with a voraus hero, which
 * holds its own content to the same width.
 */
export function ContentColumn({ sx, ...props }: ContainerProps) {
  const { contentWidth } = useBrand()
  return (
    <Container
      maxWidth={false}
      sx={[
        (theme) => ({ maxWidth: `calc(${contentWidth} + ${theme.spacing(6)})` }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  )
}
