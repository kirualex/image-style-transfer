import gql from "graphql-tag"

export const STYLES_QUERY = gql`
  query styleModels {
    styleModels {
      id
      name
      filename
      imageSrc
    }
  }
`
