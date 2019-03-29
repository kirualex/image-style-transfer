const { gql } = require('apollo-server-express')

module.exports = gql`
  type Image {
    id: ID!
    name: String!
    imageURL: String!
    model: StyleModel
  }

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
    styledImages: [Image!]!
  }

  type Mutation {
    # Returns the ID if successful
    removeStyleModel(id: ID!): String
  }

  type Subscription {
    styleTransferEvent: Event!
    modelTrainingEvent: Event!
  }
`
