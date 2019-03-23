import React from "react"
import { inject, observer } from "mobx-react"

function createWSClient() {
  const client = new WebSocket("ws://localhost:3002")
  return client
}

export const WebSocketContext = React.createContext(null)

class Provider extends React.Component {
  state = { wsClient: createWSClient() }

  componentDidMount() {
    const { wsClient } = this.state
    const { imageStore } = this.props

    wsClient.onopen = (socket, event) => {
      console.log("WS connection opened")
    }
    wsClient.onclose = () => {
      console.log("WS connection closed")
    }
    wsClient.onmessage = message => {
      console.log("Message received:", message.data)
      const event = JSON.parse(message.data)
      // save to store?
      if (event.type === 'UPLOAD_SUCCESS') {
        imageStore.setUploadedImage(event.imageURL)
      }
    }
  }

  componentWillUnmount() {
    const { wsClient } = this.state
    if (
      wsClient.readyState !== WebSocket.CLOSED ||
      wsClient.readyState !== WebSocket.CLOSING
    ) {
      wsClient.close()
    }
  }

  render() {
    const { children } = this.props
    const { wsClient } = this.state
    return (
      <WebSocketContext.Provider value={wsClient}>
        {children}
      </WebSocketContext.Provider>
    )
  }
}

export const WebSocketProvider = inject('imageStore')(observer(Provider))

export function withWebsocketClient(WrappedComponent) {
  return props => {
    return (
      <WebSocketContext.Consumer>
        {client => <WrappedComponent {...props} webSocketClient={client} />}
      </WebSocketContext.Consumer>
    )
  }
}
