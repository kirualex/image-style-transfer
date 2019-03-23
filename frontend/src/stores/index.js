import React from 'react'
import { Provider } from 'mobx-react'
import { ImageStore } from './ImageStore'

export function StoreProvider({ children }) {
  return (
    <Provider
      imageStore={new ImageStore()}
    >
      {children}
    </Provider>
  )
}