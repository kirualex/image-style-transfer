import React from "react"
import { withStyles, TextField, Button } from "@material-ui/core"
import { CloudUpload } from "@material-ui/icons"
import gql from "graphql-tag"
import { Subscription } from "react-apollo"

import ImageSelector from "../ImageSelector"
import { trainModel, fileToBase64 } from "../../api"
import { BarLoader } from "react-spinners";

const MODEL_TRAINING_EVENT_SUBSCRIPTION = gql`
  subscription modelTrainingEvent {
    modelTrainingEvent {
      name
      message
      ... on ModelTrainingIterationCompletedEvent {
        currentIteration
        maxIterations
      }
      ... on ModelTrainingCompletedEvent {
        styleModel {
          id
          name
          filename
          imageSrc
        }
      }
    }
  }
`

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  title: {
    textAlign: "center"
  },
  centeredDiv: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 15
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  trainButton: {
    marginLeft: 15
  },
  loadWrapper: {
    minHeight: 10,
    margin: 10
  }
})

function SubmitStyle({ classes }) {
  const [loading, setLoading] = React.useState(false)
  const [image, selectImage] = React.useState(null)
  const [name, setName] = React.useState("")

  return (
    <Subscription
      subscription={MODEL_TRAINING_EVENT_SUBSCRIPTION}
      onSubscriptionData={({ subscriptionData: { data } }) => {
        const { modelTrainingEvent } = data
        console.log("DATA", data)
        // set loading to false on completed event when it's done
        if (modelTrainingEvent.currentIteration === modelTrainingEvent.maxIterations) {
          setLoading(false)
        }
      }}
    >
      {() => (
        <div className={classes.root}>
          <div className={classes.loadWrapper}>
            {loading && <BarLoader width={100} widthUnit="%" />}
          </div>
          <h3 className={classes.title}>Submit a style</h3>
          <div className={classes.centeredDiv}>
            <TextField
              label="Name"
              value={name}
              disabled={!image}
              onChange={e => {
                const escapedText = e.target.value.replace(
                  /[^a-zA-Z0-9\-_/gi]/,
                  ""
                )
                setName(escapedText)
              }}
            />
          </div>
          <div className={classes.centeredDiv}>
            <ImageSelector
              onSelect={file => {
                fileToBase64(file).then(source => {
                  selectImage({
                    file,
                    src: source
                  })
                })
              }}
            />
            <Button
              variant="contained"
              component="span"
              disabled={!image || !name}
              className={classes.trainButton}
              onClick={() => {
                trainModel(image.file, name)
                  .then(() => setLoading(true))
              }}
            >
              Train model
              <CloudUpload className={classes.rightIcon} />
            </Button>
          </div>
          <div className={classes.centeredDiv}>
            {image && <img alt="model-source" src={image.src} />}
          </div>
        </div>
      )}
    </Subscription>
  )
}

export default withStyles(styles)(SubmitStyle)
