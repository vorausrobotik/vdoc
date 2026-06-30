import { useState, ReactNode } from 'react'

import { IFrameScrollContext } from './IFrameScrollContext'

export function IFrameScrollProvider({ children }: { children: ReactNode }) {
  const [scrollY, setScrollY] = useState(0)

  return <IFrameScrollContext.Provider value={{ scrollY, setScrollY }}>{children}</IFrameScrollContext.Provider>
}
