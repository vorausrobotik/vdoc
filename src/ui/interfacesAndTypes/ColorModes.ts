export type ColorMode = 'light' | 'dark' | 'system'
export type EffectiveColorMode = 'light' | 'dark'

/** The order the app bar toggle steps through, starting at the mode vdoc defaults to. */
export const colorModeCycle: readonly ColorMode[] = ['system', 'light', 'dark']

/**
 * Returns the mode the toggle moves to when it is pressed while ``mode`` is active.
 *
 * @param mode The currently selected color mode.
 */
export const nextColorMode = (mode: ColorMode): ColorMode =>
  colorModeCycle[(colorModeCycle.indexOf(mode) + 1) % colorModeCycle.length]
