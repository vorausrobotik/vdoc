// One module, so the order holds: the dark tokens override the light ones only by coming later, since
// `[data-theme='dark']` and `:root` are equally specific.
import '@voraus/assets/fonts/roboto.css'
import '@voraus/tokens/voraus.css'
import '@voraus/tokens/voraus-dark.css'
import '@voraus/css/voraus.css'

import { vorausTheme } from '@voraus/mui-theme'
import { VorausEyebrow } from '@voraus/react'
import vorausIcon from '@/icons/voraus.ico'
import type { Brand } from '../Brand'
import { Header, Hero, VersionBadge } from './components'

export const brand: Brand = {
  theme: vorausTheme,
  favicon: vorausIcon,
  Header,
  Hero,
  SectionLabel: VorausEyebrow,
  VersionBadge,
  primaryButton: 'gradient',
  contentWidth: 'var(--voraus-space-content-width)',
}
