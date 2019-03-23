import React from "react"
import { withStyles } from "@material-ui/core/styles"
import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"

const styles = {
  root: {
    flexGrow: 1
  },
  children: {
    margin: 15
  }
}

function Layout(props) {
  const { children, classes } = props

  return (
    <div className={classes.root}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="title" color="inherit">
            Transform your image!
          </Typography>
        </Toolbar>
      </AppBar>
      <div className={classes.children}>{children}</div>
    </div>
  )
}

export default withStyles(styles)(Layout)
