import { PluginBaseT } from './PluginBase'
import EmailIcon from '@mui/icons-material/Email'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import PublicIcon from '@mui/icons-material/Public'
import GitHubIcon from '@mui/icons-material/GitHub'
import BugReportIcon from '@mui/icons-material/BugReport'
import HomeIcon from '@mui/icons-material/Home'

type iconT = 'email' | 'support' | 'public' | 'github' | 'bugs' | 'home'
type targetT = '_blank' | '_self' | '_parent' | '_top'

export const iconMap: Record<iconT, React.ElementType> = {
  email: EmailIcon,
  support: SupportAgentIcon,
  public: PublicIcon,
  github: GitHubIcon,
  bugs: BugReportIcon,
  home: HomeIcon,
}

export type FooterLinkT = {
  title: string
  icon: iconT
  href: string
  target: targetT
}

export type FooterLinkGroupT = {
  title: string
  icon: iconT
  links: FooterLinkT[]
}

type FooterPluginFields = {
  links: FooterLinkGroupT[]
  copyright?: string
}

export type FooterPluginT = PluginBaseT<FooterPluginFields>

export default FooterPluginT
