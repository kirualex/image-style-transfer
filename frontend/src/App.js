import React, { Component } from 'react'
import './App.css'
import Layout from './components/Layout'
import ImageUploader from './components/ImageUploader'
import { WebSocketProvider } from './api/ws'
import { StoreProvider } from './stores'

class App extends Component {
  render() {
    return (
      <StoreProvider>
        <WebSocketProvider>
          <Layout>
            <ImageUploader />
          </Layout>
        </WebSocketProvider>
      </StoreProvider>
    );
  }
}

export default App;
