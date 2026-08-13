import { type ReactNode, useState } from 'react'

import { ContentInsetContext } from './ContentInsetContext'

export function ContentInsetProvider({ children }: { children: ReactNode }) {
  const [contentInset, setContentInset] = useState(0)

  return (
    <ContentInsetContext.Provider value={{ contentInset, setContentInset }}>{children}</ContentInsetContext.Provider>
  )
}
