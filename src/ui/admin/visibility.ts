import LinkIcon from '@mui/icons-material/Link'
import LockIcon from '@mui/icons-material/Lock'
import PublicIcon from '@mui/icons-material/Public'
import type { ProjectVisibility } from '@/interfacesAndTypes/Project'

export interface VisibilityChoice {
  id: ProjectVisibility
  name: string
  description: string
  color: 'success' | 'warning' | 'error'
  Icon: typeof PublicIcon
}

export const VISIBILITY_CHOICES: VisibilityChoice[] = [
  { id: 'listed', name: 'Listed', description: 'On the landing page', color: 'success', Icon: PublicIcon },
  { id: 'unlisted', name: 'Unlisted', description: 'Readable with a link only', color: 'warning', Icon: LinkIcon },
  { id: 'locked', name: 'Locked', description: 'Not readable at all', color: 'error', Icon: LockIcon },
]
