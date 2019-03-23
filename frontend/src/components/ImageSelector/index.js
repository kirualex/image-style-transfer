import React from "react"
import { Tooltip, Button } from "@material-ui/core"

function ImageSelector(props) {
  const { selectFile } = props
  return (
    <React.Fragment>
      <input
        accept=".jpg, .jpeg"
        style={{ display: "none" }}
        id="contained-button-file"
        multiple
        type="file"
        onChange={e => {
          const file = e.target.files[0]
          if (!file) {
            return
          }
          selectFile(file)
        }}
      />
      <label htmlFor="contained-button-file">
        <Tooltip title="Accepts .jpg and .jpeg files">
          <Button variant="contained" component="span">
            Select image
          </Button>
        </Tooltip>
      </label>
    </React.Fragment>
  )
}

export default ImageSelector
