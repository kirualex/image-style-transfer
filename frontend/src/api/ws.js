import React from "react"
import { ImageStoreContext } from "../stores/ImageStore"

function createWSClient() {
  const client = new WebSocket("ws://localhost:3002")
  return client
}

export const WebSocketContext = React.createContext(null)

export function WebSocketProvider(props) {
  const { children } = props

  const [wsClient] = React.useState(createWSClient())
  const imageStore = React.useContext(ImageStoreContext)

  React.useEffect(() => {
    wsClient.onopen = (socket, event) => {
      console.log("WS connection opened")
    }
    wsClient.onclose = () => {
      console.log("WS connection closed")
    }
    wsClient.onmessage = message => {
      console.log("Message received:", message.data)
      const event = JSON.parse(message.data)
      if (event.type === "UPLOAD_SUCCESS") {
        imageStore.setUploadedImage(event.imageURL)
      }
    }

    return () => {
      if (
        wsClient.readyState !== WebSocket.CLOSED ||
        wsClient.readyState !== WebSocket.CLOSING
      ) {
        wsClient.close()
      }
    }
  }, [wsClient])
  return (
    <WebSocketContext.Provider value={wsClient}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function withWebsocketClient(WrappedComponent) {
  return props => {
    return (
      <WebSocketContext.Consumer>
        {client => <WrappedComponent {...props} webSocketClient={client} />}
      </WebSocketContext.Consumer>
    )
  }
}
