const WebSocket = require('ws')

const ws = new WebSocket.Server({
  port: 3002
})

ws.on('connection', (socket, incomingSocket, request) => {
  console.log('ws connection')

  socket.on('message', message => {
    console.log('ws message:', message)

  })
})

// ws.on('headers', (headers, request) => {
//   console.log('ws headers', headers)
// })

ws.on('error', (socket, err) => {
  console.log('ws error', err)
})

ws.on('listening', () => {
  console.log('ws listening')
})

module.exports = { ws }
