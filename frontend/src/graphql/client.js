import { split } from "apollo-link"
import { HttpLink } from "apollo-link-http"
import { WebSocketLink } from "apollo-link-ws"
import { getMainDefinition } from "apollo-utilities"
import { ApolloClient } from "apollo-client"
import {
  InMemoryCache,
  IntrospectionFragmentMatcher
} from "apollo-cache-inmemory"

import introspectionQueryResultData from "./fragmentTypes.json"

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData
})

const cache = new InMemoryCache({ fragmentMatcher })

const httpLink = new HttpLink({
  uri: "http://localhost:3001/graphql"
})

const wsLink = new WebSocketLink({
  uri: `ws://localhost:3001/graphql`,
  options: {
    reconnect: true
  }
})

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === "OperationDefinition" && operation === "subscription"
  },
  wsLink,
  httpLink
)

export const apolloClient = new ApolloClient({
  link,
  cache
})
