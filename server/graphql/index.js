const { ApolloServer } = require("apollo-server-express")
const typeDefs = require('./typeDefs')
const resolvers = require('./resolvers')

function createGraphQLServer(expressApp, httpServer) {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: error => {
      console.error(error)
      return error
    }
  })

  apolloServer.applyMiddleware({ app: expressApp })
  apolloServer.installSubscriptionHandlers(httpServer)

  return apolloServer
}

module.exports = { createGraphQLServer }
