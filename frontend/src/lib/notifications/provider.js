import React from "react"
import { Snackbar, withStyles, IconButton } from "@material-ui/core"
import CloseIcon from "@material-ui/icons/Close"
import { NotificationContext } from "./context"

const styles = theme => ({
  close: {
    padding: theme.spacing.unit / 2
  }
})

const actions = {
  SHOW: "SHOW",
  HIDE: "HIDE"
}

function reducer(state, action) {
  switch (action.type) {
    case actions.SHOW:
      return { ...state, isOpen: true, message: action.message }
    case actions.HIDE:
      if (action.reason !== "clickaway") {
        return { ...state, isOpen: false }
      }
      return state
    default:
      console.warn("invalid action type:", action.type)
      return state
  }
}

const initialState = {
  message: null,
  isOpen: false
}

function NotificationProvider({ children, classes, options = {} }) {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const queue = React.useRef([])

  function processQueue() {
    if (queue.current.length === 0) {
      return
    }
    const message = queue.current.shift()
    dispatch({ type: actions.SHOW, message })
  }

  function show(element, options) {
    queue.current.push({ key: Date.now().toString(), element, options })
    if (state.isOpen) {
      dispatch({ type: actions.HIDE })
    } else {
      processQueue()
    }
  }

  function hide(reason) {
    dispatch({ type: actions.HIDE, reason })
  }

  const {
    anchorOrigin,
    autoHideDuration,
    ContentProps,
    action,
    ...restOptions
  } = options

  return (
    <NotificationContext.Provider value={{ show, hide }}>
      {children}
      <Snackbar
        key={state.message ? state.message.key : "default"}
        anchorOrigin={
          anchorOrigin || {
            vertical: "bottom",
            horizontal: "left"
          }
        }
        open={state.isOpen}
        autoHideDuration={autoHideDuration || 6000}
        onClose={(e, reason) => hide(reason)}
        onExited={() => processQueue()}
        ContentProps={
          ContentProps || {
            "aria-describedby": "message-id"
          }
        }
        message={state.message ? state.message.element : ""}
        action={
          action || [
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              className={classes.close}
              onClick={() => hide()}
            >
              <CloseIcon />
            </IconButton>
          ]
        }
        {...restOptions}
      />
    </NotificationContext.Provider>
  )
}

export default withStyles(styles)(NotificationProvider)
