import React from "react"
import {
  withStyles,
  Select,
  Input,
  MenuItem,
  InputLabel
} from "@material-ui/core"

const styles = {
  select: {
    marginBottom: 15,
    width: "100%"
  },
  previewImageDiv: {
    display: 'flex',
    justifyContent: 'center'
  },
  previewPlaceholder: {
    minHeight: 150
  }
}

function StyleModelSelector(props) {
  const { classes, selectStyleModel, selectedStyleModel, styleModels } = props

  return (
    <React.Fragment>
      <div className={classes.previewImageDiv}>
        {selectedStyleModel ? (
          <img
            height="150"          
            alt={selectedStyleModel.name}
            src={selectedStyleModel.imageSrc}
          />
        ) : (<div className={classes.previewPlaceholder} />)}
      </div>
      <InputLabel htmlFor="model-selector">Select a style</InputLabel>
      <Select
        id="model-selector"
        disabled={styleModels.length === 0}
        className={classes.select}
        value={selectedStyleModel ? selectedStyleModel.id : ""}
        onChange={e => {
          const model = styleModels.find(model => model.id === e.target.value)
          selectStyleModel(model)
        }}
        input={<Input name="model" id="model-selector" />}
      >
        {styleModels.map(model => (
          <MenuItem key={model.id} value={model.id}>
            {model.name}
          </MenuItem>
        ))}
      </Select>
    </React.Fragment>
  )
}

export default withStyles(styles)(StyleModelSelector)
