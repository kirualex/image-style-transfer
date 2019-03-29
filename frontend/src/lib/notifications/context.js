import React from "react"

export const initialState = {
  show: (element, options) => {},
  hide: () => {}
}

export const NotificationContext = React.createContext(initialState)
