import { type SxProps, type Theme, useTheme } from '@mui/material'
import Box from '@mui/material/Box'

/**
 * vdoc's own mark: pages fanned out behind each other, since every published version stays readable.
 *
 * The outlines take the text color and the front page the primary color, so the mark follows the color
 * mode. `src/ui/icons/vdoc.svg` is the same drawing as a favicon, and a change to one belongs in both.
 */
export function VdocLogo({ sx }: { sx?: SxProps<Theme> }) {
  const theme = useTheme()
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      width={30}
      height={30}
      aria-hidden
      sx={[{ color: 'text.primary', flex: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <rect
        x="12"
        y="3"
        width="16"
        height="20"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      <rect
        x="8.5"
        y="6"
        width="16"
        height="20"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.6"
      />
      <rect x="5" y="9" width="16" height="20" rx="3" fill={theme.palette.primary.main} />
      <path
        d="M9 16h8M9 21h5"
        fill="none"
        stroke={theme.palette.primary.contrastText}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Box>
  )
}
