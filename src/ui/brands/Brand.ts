import type { ButtonProps } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { getRouteApi } from '@tanstack/react-router'
import type { ComponentType, ReactNode } from 'react'
import type { ThemeNameT } from '@/interfacesAndTypes/plugins/SitePlugin'
import { brand as defaultBrand } from './default'

/**
 * Where the color scheme is written on `<html>`. The voraus token stylesheets hang their dark values
 * under `[data-theme='dark']`, and `vorausTheme` switches the same attribute.
 */
export const COLOR_SCHEME_ATTRIBUTE = 'data-theme'

export interface HeaderProps {
  /** The search, where one is configured */
  search: ReactNode
  /** The controls on the right: the version of a documentation and the color mode */
  actions: ReactNode
  'data-testid'?: string
}

export interface SectionLabelProps {
  children: ReactNode
  'data-testid'?: string
}

export interface HeroProps {
  title: ReactNode
  lead: ReactNode
  /** The long description, below the lead */
  children?: ReactNode
  actions?: ReactNode
  'data-testid'?: string
}

/**
 * Everything that differs between the themes, so that no component has to ask which one is set.
 *
 * Material UI's theme styles what Material UI draws. The components here are the few pieces the
 * voraus look draws with its own stylesheet, each with an equivalent in Material UI's own look.
 */
export interface Brand {
  theme: Theme
  /** The URL of the browser tab's icon */
  favicon: string
  /** The bar at the top of every page, with the mark linking to `/` as its first element */
  Header: ComponentType<HeaderProps>
  /** What the instance is, above the projects on the landing page */
  Hero: ComponentType<HeroProps>
  /** The heading of a group of projects */
  SectionLabel: ComponentType<SectionLabelProps>
  /** A project's newest version, beside its title */
  VersionBadge: ComponentType<{ version: string }>
  /** The variant of the one button on a page that matters most */
  primaryButton: ButtonProps['variant']
  /** How wide the landing page's content runs, as a CSS length */
  contentWidth: string
}

/**
 * Resolves the configured brand, loading what it needs before anything paints.
 *
 * The default brand ships with the application. The voraus brand is imported only when it is asked
 * for: its stylesheet styles `body` and the headings directly, so loading it unconditionally would
 * brand the default theme as well.
 */
export async function loadBrand(name: ThemeNameT): Promise<Brand> {
  const brand = name === 'voraus' ? (await import('./voraus')).brand : defaultBrand
  // `index.html` names a favicon for the first paint, which the brand may replace
  document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', brand.favicon)
  return brand
}

const rootRoute = getRouteApi('__root__')

/** The brand the root loader resolved. */
export const useBrand = (): Brand => rootRoute.useLoaderData().brand
