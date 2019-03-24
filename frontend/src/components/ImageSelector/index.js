import React from "react"
import { withStyles, Tooltip, Button } from "@material-ui/core"

const styles = {
  tooltip: {
    fontSize: 12
  },
  fileInput: {
    display: "none"
  }
}

function ImageSelector({ classes, onSelect, disabled }) {

  return (
    <React.Fragment>
      <input
        disabled={disabled}
        accept=".jpg, .jpeg"
        className={classes.fileInput}
        id="contained-button-file"
        multiple
        type="file"
        onChange={e => {
          const file = e.target.files[0]
          if (!file) {
            return
          }
          onSelect(file)
        }}
      />
      <label htmlFor="contained-button-file">
        <Tooltip
          classes={{
            tooltip: classes.tooltip
          }}
          title="Accepts .jpg and .jpeg files"
        >
          <Button variant="contained" component="span">
            Select image
          </Button>
        </Tooltip>
      </label>
    </React.Fragment>
  )
}

export default withStyles(styles)(ImageSelector)
