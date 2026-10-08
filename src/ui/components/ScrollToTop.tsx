import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { Fab, Fade, useTheme } from '@mui/material'
import testIDs from '@/interfacesAndTypes/testIDs'

interface ScrollToTopProps {
  visible: boolean
  onScrollToTop: () => void
  /** Height of what is fixed to the bottom edge below the button, such as the footer. */
  bottomOffset?: number
}

export default function ScrollToTop({ visible, onScrollToTop, bottomOffset = 0 }: ScrollToTopProps) {
  const theme = useTheme()

  return (
    <Fade in={visible}>
      <Fab
        data-testid={testIDs.scrollToTop}
        onClick={onScrollToTop}
        color="primary"
        size="medium"
        aria-label="scroll to top"
        sx={{
          position: 'fixed',
          bottom: `calc(${bottomOffset}px + ${theme.spacing(2)})`,
          right: theme.spacing(2),
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Fade>
  )
}
