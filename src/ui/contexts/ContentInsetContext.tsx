import { createContext, useContext } from 'react'

export interface ContentInsetContextType {
  /**
   * Horizontal offset vdoc insets its own header content by, in CSS pixels.
   *
   * Measured rather than written down: the framed documentation aligns its own header content to it,
   * and a constant would have to be kept in step with vdoc's layout by hand, in another repository.
   * `0` means not measured yet, in which case nothing is sent and the frame keeps its own layout.
   */
  contentInset: number
  setContentInset: (contentInset: number) => void
}

export const ContentInsetContext = createContext<ContentInsetContextType>({
  contentInset: 0,
  setContentInset: () => {},
})

export function useContentInset() {
  return useContext(ContentInsetContext)
}
