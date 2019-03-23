const { gql } = require('apollo-server-express')

module.exports = gql`
  type StyleModel {
    id: ID!
    name: String
    filename: String
    imageSrc: String
  }

  type Query {
    styleModels: [StyleModel!]!
  }
`
