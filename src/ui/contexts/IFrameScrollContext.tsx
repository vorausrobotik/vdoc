import { createContext, useContext, useState, ReactNode } from 'react'

interface IFrameScrollContextType {
  scrollY: number
  setScrollY: (scrollY: number) => void
}

const IFrameScrollContext = createContext<IFrameScrollContextType>({
  scrollY: 0,
  setScrollY: () => {},
})

export function IFrameScrollProvider({ children }: { children: ReactNode }) {
  const [scrollY, setScrollY] = useState(0)

  return <IFrameScrollContext.Provider value={{ scrollY, setScrollY }}>{children}</IFrameScrollContext.Provider>
}

export function useIFrameScroll() {
  return useContext(IFrameScrollContext)
}
