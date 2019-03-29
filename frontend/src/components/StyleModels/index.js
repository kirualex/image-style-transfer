import React from "react"
import {
  withStyles,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Button
} from "@material-ui/core"
import gql from "graphql-tag"
import { Query, Mutation } from "react-apollo"

import { STYLES_QUERY } from "../../graphql/queries"

const styles = {
  title: {
    textAlign: "center"
  },
  thumbnail: {
    maxWidth: 150,
    maxHeight: 150
  }
}

const REMOVE_MODEL_MUTATION = gql`
  mutation removeStyleModel($id: ID!) {
    removeStyleModel(id: $id)
  }
`

function StyleModels({ classes }) {
  return (
    <div>
      <h3 className={classes.title}>Styles</h3>
      <Query query={STYLES_QUERY}>
        {({ data: { styleModels = [] } = {} }) => (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Source image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {styleModels.map(model => (
                <TableRow key={model.id}>
                  <TableCell>
                    <img
                      className={classes.thumbnail}
                      alt={model.name}
                      src={model.imageSrc}
                    />
                  </TableCell>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>
                    <Mutation
                      mutation={REMOVE_MODEL_MUTATION}
                      update={(proxy, { data }) => {
                        if (!data.removeStyleModel) {
                          return
                        }
                        const modelId = data.removeStyleModel
                        const { styleModels } = proxy.readQuery({
                          query: STYLES_QUERY
                        })
                        const updatedStyleModels = styleModels.filter(
                          model => model.id !== modelId
                        )
                        proxy.writeQuery({
                          query: STYLES_QUERY,
                          data: { styleModels: updatedStyleModels }
                        })
                      }}
                    >
                      {removeStyleModel => (
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => {
                            removeStyleModel({
                              variables: { id: model.id },
                              optimisticResponse: {
                                removeStyleModel: model.id,
                                __typename: 'Mutation'
                              }
                            })
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </Mutation>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Query>
    </div>
  )
}

export default withStyles(styles)(StyleModels)
