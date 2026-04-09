import { Fab, Fade, useTheme } from '@mui/material'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import testIDs from '../interfacesAndTypes/testIDs'

interface ScrollToTopProps {
  visible: boolean
  onScrollToTop: () => void
}

export default function ScrollToTop({ visible, onScrollToTop }: ScrollToTopProps) {
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
          bottom: theme.spacing(2),
          right: theme.spacing(2),
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Fade>
  )
}
