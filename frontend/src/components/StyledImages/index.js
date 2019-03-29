import React from "react"
import { Query } from "react-apollo"
import gql from "graphql-tag"
import { withStyles } from "@material-ui/core"

const STYLED_IMAGES_QUERY = gql`
  query styledImages {
    styledImages {
      id
      name
      imageURL
      model {
        id
        name
      }
    }
  }
`

const styles = {
  title: {
    textAlign: 'center'
  },
  imageContainer: {
    display: "flex",
    justifyContent: "center"
  },
  image: {
    margin: 5
  }
}

function StyledImages({ classes }) {
  return (
    <div>
      <h3 className={classes.title}>All stylized images</h3>
      <Query query={STYLED_IMAGES_QUERY}>
        {({ data: { styledImages = [] } = {} }) => (
          <div className={classes.imageContainer}>
            {styledImages.map(image => (
              <img
                key={image.id}
                className={classes.image}
                src={image.imageURL}
                alt={image.name}
              />
            ))}
          </div>
        )}
      </Query>
    </div>
  )
}

export default withStyles(styles)(StyledImages)
