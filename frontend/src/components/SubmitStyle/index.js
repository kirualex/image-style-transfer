import React from "react"
import { withStyles, TextField, Button } from "@material-ui/core"
import { CloudUpload } from "@material-ui/icons"
import gql from "graphql-tag"
import { Subscription } from "react-apollo"
import { BarLoader } from "react-spinners"

import ImageSelector from "../ImageSelector"
import { trainModel, fileToBase64 } from "../../api"
import { NotificationContext } from "../../lib/notifications/context"
import { STYLES_QUERY } from "../../graphql/queries"

const MODEL_TRAINING_EVENT_SUBSCRIPTION = gql`
  subscription modelTrainingEvent {
    modelTrainingEvent {
      name
      message
      ... on ModelTrainingStartedEvent {
        iterations
      }
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

function updateStyleModelQuery(model, client) {
  try {
    const { styleModels } = client.readQuery({
      query: STYLES_QUERY
    })
    
    client.writeQuery({
      query: STYLES_QUERY,
      data: { styleModels: [...styleModels, model] }
    })
  } catch (e) {
    console.warn(e)
  }
}

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

const actions = {
  SET_LOADING: "SET_LOADING",
  SET_IMAGE: "SET_IMAGE",
  SET_NAME: "SET_NAME",
  SET_ITERATIONS: "SET_ITERATIONS"
}

function reducer(state, action) {
  switch (action.type) {
    case actions.SET_ITERATIONS:
      return { ...state, iterations: action.iterations }
    case actions.SET_NAME:
      return { ...state, name: action.name }
    case actions.SET_IMAGE:
      return { ...state, image: action.image }
    case actions.SET_LOADING:
      return { ...state, isLoading: action.isLoading }
    default:
      console.warn("invalid action type:", action.type)
      return state
  }
}

const initialState = {
  name: "",
  isLoading: false,
  image: null,
  iterations: 5
}

function SubmitStyle({ classes }) {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const nameInput = React.useRef(null)
  const notification = React.useContext(NotificationContext)

  return (
    <Subscription
      subscription={MODEL_TRAINING_EVENT_SUBSCRIPTION}
      onSubscriptionData={({ client, subscriptionData }) => {
        const modelTrainingEvent = subscriptionData.data.modelTrainingEvent
        console.log("modelTrainingEvent", modelTrainingEvent)

        if (modelTrainingEvent.name === "MODEL_TRAINING_STARTED") {
          notification.show(
            <span>
              {`Iterations completed: 0/${modelTrainingEvent.iterations}`}
            </span>
          )
          dispatch({ type: actions.SET_LOADING, isLoading: true })
        }
        if (modelTrainingEvent.name === "MODEL_TRAINING_ITERATION_COMPLETED") {
          notification.show(
            <span>
              {`Iterations completed: ${modelTrainingEvent.currentIteration}/${
                modelTrainingEvent.maxIterations
              }`}
            </span>
          )
        }
        if (modelTrainingEvent.name === "MODEL_TRAINING_COMPLETED") {
          notification.show(<span>Style model training completed!</span>)
          dispatch({ type: actions.SET_LOADING, isLoading: false })
          if (modelTrainingEvent.styleModel) {
            updateStyleModelQuery(modelTrainingEvent.styleModel, client)
          }
        }
      }}
    >
      {() => (
        <div className={classes.root}>
          <div className={classes.loadWrapper}>
            {state.isLoading && <BarLoader width={100} widthUnit="%" />}
          </div>
          <h3 className={classes.title}>Train a model from an image</h3>
          <div className={classes.centeredDiv}>
            <TextField
              label="Model name"
              value={state.name}
              disabled={!state.image}
              inputRef={input => {
                nameInput.current = input
              }}
              onChange={e => {
                const escapedText = e.target.value.replace(
                  /[^a-zA-Z0-9\-_/gi]/,
                  ""
                )
                dispatch({ type: actions.SET_NAME, name: escapedText })
              }}
            />
            <TextField
              label="Iterations"
              type="number"
              inputProps={{
                min: 2,
                max: 10000
              }}
              value={state.iterations}
              onChange={e => {
                dispatch({
                  type: actions.SET_ITERATIONS,
                  iterations: e.target.value
                })
              }}
            />
          </div>
          <div className={classes.centeredDiv}>
            <ImageSelector
              onSelect={file => {
                fileToBase64(file).then(source => {
                  dispatch({
                    type: actions.SET_IMAGE,
                    image: {
                      file,
                      src: source
                    }
                  })
                  if (!state.name && nameInput.current) {
                    nameInput.current.focus()
                  }
                })
              }}
            />
            <Button
              variant="contained"
              component="span"
              disabled={!state.image || !state.name}
              className={classes.trainButton}
              onClick={() => {
                trainModel({
                  file: state.image.file,
                  modelName: state.name,
                  iterations: state.iterations
                })
              }}
            >
              Train
              <CloudUpload className={classes.rightIcon} />
            </Button>
          </div>
          <div className={classes.centeredDiv}>
            {state.image && <img alt="model-source" src={state.image.src} />}
          </div>
        </div>
      )}
    </Subscription>
  )
}

export default withStyles(styles)(SubmitStyle)
