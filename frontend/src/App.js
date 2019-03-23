import React, { Component } from "react"
import { ApolloProvider } from "react-apollo"

import "./App.css"
import Layout from "./components/Layout"
import ImageUploader from "./components/ImageUploader"
import { apolloClient } from "./graphql/client"

class App extends Component {
  render() {
    return (
      <ApolloProvider client={apolloClient}>
        <Layout>
          <ImageUploader />
        </Layout>
      </ApolloProvider>
    )
  }
}

export default App
