import { type ReactNode, useState } from 'react'

import { ContentInsetContext } from './ContentInsetContext'

export function ContentInsetProvider({ children }: { children: ReactNode }) {
  const [contentInset, setContentInset] = useState<number | null>(null)

  return (
    <ContentInsetContext.Provider value={{ contentInset, setContentInset }}>{children}</ContentInsetContext.Provider>
  )
}
