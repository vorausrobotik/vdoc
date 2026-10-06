import { createContext, useContext } from 'react'

export interface ContentInsetContextType {
  /**
   * Horizontal offset vdoc insets its own header content by, in CSS pixels.
   *
   * Measured rather than written down: the framed documentation aligns its own header content to it,
   * and a constant would have to be kept in step with vdoc's layout by hand, in another repository.
   * `null` means not measured yet. The frame is not loaded before the first measurement, because it
   * reads the inset from its address only once. `0` means there is nothing to align to, in which
   * case nothing is sent and the frame keeps its own layout.
   */
  contentInset: number | null
  setContentInset: (contentInset: number) => void
}

export const ContentInsetContext = createContext<ContentInsetContextType>({
  contentInset: null,
  setContentInset: () => {},
})

export function useContentInset() {
  return useContext(ContentInsetContext)
}
