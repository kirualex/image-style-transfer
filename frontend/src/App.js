import React from "react"
import { ApolloProvider } from "react-apollo"
import { Router, Redirect } from "@reach/router"

import "./App.css"
import { apolloClient } from "./graphql/client"
import Layout from "./components/Layout"
import ImageUploader from "./components/ImageUploader"
import Styles from "./components/Styles"
import StyledImages from "./components/StyledImages"
import NotificationProvider from "./lib/notifications/provider"

function RouteNotFound() {
  return <Redirect noThrow to="/" />
}

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <NotificationProvider>
        <Router>
          <Layout path="/">
            <ImageUploader path="/" />
            <Styles path="/styles" />
            <StyledImages path="/images" />
            <RouteNotFound path="*" />
          </Layout>
        </Router>
      </NotificationProvider>
    </ApolloProvider>
  )
}

export default App
