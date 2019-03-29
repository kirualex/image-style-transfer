import React from "react"
import { withStyles } from "@material-ui/core/styles"
import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"
import { Link } from "@reach/router"

const styles = {
  root: {
    flexGrow: 1
  },
  children: {
    margin: 15
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between"
  },
  link: {
    color: "white",
    margin: 5
  },
  noTextDecoration: {
    textDecoration: "none"
  }
}

function getLinkClasses(isCurrent, classes) {
  const className = isCurrent
    ? `${classes.link} ${classes.noTextDecoration}`
    : classes.link
  return { className, disabled: isCurrent }
}

function Layout({ children, path, classes }) {
  return (
    <div className={classes.root}>
      <AppBar position="static" color="primary">
        <Toolbar className={classes.toolbar}>
          <div>
            <Typography variant="title" color="inherit">
              <Link to="/" className={`${classes.noTextDecoration} ${classes.link}`}>Transform your image!</Link>
            </Typography>
          </div>
          <div>
            <Link
              getProps={({ isCurrent }) => getLinkClasses(isCurrent, classes)}
              to="/"
            >
              Home
            </Link>
            <Link
              getProps={({ isCurrent }) => getLinkClasses(isCurrent, classes)}
              to="/train"
            >
              Train model
            </Link>
          </div>
        </Toolbar>
      </AppBar>
      <div className={classes.children}>{children}</div>
    </div>
  )
}

export default withStyles(styles)(Layout)
