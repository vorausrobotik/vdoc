import { VorausAppBar, VorausHero, VorausTag } from '@voraus/react'
import type { HeaderProps, HeroProps } from '../Brand'

/** The bar of the design system as it is, with its own mark. vdoc's controls stand on its right. */
export function Header({ search, actions, 'data-testid': testID }: HeaderProps) {
  return (
    <VorausAppBar
      data-testid={testID}
      actions={
        <>
          {search}
          {actions}
        </>
      }
    />
  )
}

export function Hero({ title, lead, children, actions, 'data-testid': testID }: HeroProps) {
  return (
    <VorausHero data-testid={testID} eyebrow="Documentation" title={title} lead={lead} actions={actions}>
      {children}
    </VorausHero>
  )
}

export function VersionBadge({ version }: { version: string }) {
  return <VorausTag className="voraus-card__version">{version}</VorausTag>
}
