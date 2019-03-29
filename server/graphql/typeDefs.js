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

  type ModelTrainingStartedEvent implements Event {
    name: String!
    message: String!
    iterations: Int!
  }

  type ModelTrainingIterationCompletedEvent implements Event {
    name: String!
    message: String!
    currentIteration: Int!
    maxIterations: Int!
  }

  type ModelTrainingCompletedEvent implements Event {
    name: String!
    message: String!
    styleModel: StyleModel!
  }

  type Query {
    styleModels: [StyleModel!]!
  }

  type Subscription {
    styleTransferEvent: Event!
    modelTrainingEvent: Event!
  }
`
