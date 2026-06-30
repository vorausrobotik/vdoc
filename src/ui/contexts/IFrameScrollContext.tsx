import { createContext, useContext } from 'react'

export interface IFrameScrollContextType {
  scrollY: number
  setScrollY: (scrollY: number) => void
}

export const IFrameScrollContext = createContext<IFrameScrollContextType>({
  scrollY: 0,
  setScrollY: () => {},
})

export function useIFrameScroll() {
  return useContext(IFrameScrollContext)
}
