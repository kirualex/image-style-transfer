import React from "react"
import { ApolloProvider } from "react-apollo"
import { Router, Redirect } from "@reach/router"

import "./App.css"
import { apolloClient } from "./graphql/client"
import Layout from "./components/Layout"
import ImageUploader from "./components/ImageUploader"
import SubmitStyle from "./components/SubmitStyle"
import StyledImages from "./components/StyledImages"

function RouteNotFound() {
  return <Redirect noThrow to="/" />
}

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <Layout path="/">
          <ImageUploader path="/" />
          <SubmitStyle path="/train" />
          <StyledImages path="/images" />
          <RouteNotFound path="*" />
        </Layout>
      </Router>
    </ApolloProvider>
  )
}

export default App
