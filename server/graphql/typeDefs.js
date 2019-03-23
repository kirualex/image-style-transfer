const { gql } = require('apollo-server-express')

module.exports = gql`
  type StyleModel {
    id: ID!
    name: String
    filename: String
    imageSrc: String
  }

  interface Event {
    name: String!
    message: String!
  }

  type GenericEvent implements Event {
    name: String!
    message: String!
  }

  type UploadSucceededEvent implements Event {
    name: String!
    message: String!
    imageURL: String!
  }

  type Query {
    styleModels: [StyleModel!]!
  }

  type Subscription {
    styleTransferEvent: Event!
  }
`
