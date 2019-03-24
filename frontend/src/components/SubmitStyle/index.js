import React from "react"
import { withStyles, TextField } from "@material-ui/core"
import ImageSelector from "../ImageSelector"
import { fileToBase64 } from "../../api"

const styles = {
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
  }
}

function SubmitStyle({ classes }) {
  const [image, selectImage] = React.useState(null)
  const [name, setName] = React.useState("")
  return (
    <div className={classes.root}>
      <h3 className={classes.title}>Submit a style</h3>
      <div className={classes.centeredDiv}>
        <TextField
          label="Name"
          value={name}
          onChange={e => {
            const escapedText = e.target.value.replace(/[^a-zA-Z0-9\-_/gi]/, "")
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
      </div>
      <div className={classes.centeredDiv}>
        {image && <img alt="model-source" src={image.src} />}
      </div>
    </div>
  )
}

export default withStyles(styles)(SubmitStyle)
