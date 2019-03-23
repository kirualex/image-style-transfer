import React, { Component } from "react"
import { withStyles, Button } from "@material-ui/core"
import { CloudUpload } from "@material-ui/icons"
import { inject, observer } from "mobx-react"

import { uploadImage, fileToBase64 } from "../../api"
import StyleModelSelector from "../StyleModelSelector"
import ImageSelector from "../ImageSelector"

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  sendButton: {
    marginLeft: 15
  },
  imageName: {
    textAlign: "center",
    margin: 15
  },
  image: {
    maxWidth: 500,
    maxHeight: 500,
    margin: 5
  },
  buttons: {
    display: "flex",
    justifyContent: "center"
  },
  images: {
    display: "flex",
    alignItems: "center",
    flexDirection: "column"
  }
})

class ImageUploader extends Component {
  state = {
    styleModels: [],
    selectedModel: null,
    selectedImage: {
      file: null,
      src: ""
    }
  }

  componentDidMount() {
    fetch("http://localhost:3001/stylemodels", {
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          const styleModels = JSON.parse(data)
          this.setState({
            styleModels,
            selectedStyleModel: styleModels[0]
          })
        }
      })
  }

  sendFile = () => {
    const { selectedImage, selectedStyleModel } = this.state
    if (selectedImage.file) {
      uploadImage(selectedImage.file, selectedStyleModel.id)
    }
  }

  onFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      this.setState(({ selectedImage }) => ({
        selectedImage: { ...selectedImage, file }
      }))

      fileToBase64(file).then(source => {
        this.setState(({ selectedImage }) => ({
          selectedImage: { ...selectedImage, src: source }
        }))
      })
    }
  }

  render() {
    const { classes, imageStore } = this.props
    const { styleModels, selectedStyleModel, selectedImage } = this.state

    return (
      <div className={classes.root}>
        <div>
          <StyleModelSelector
            styleModels={styleModels}
            selectedStyleModel={selectedStyleModel}
            selectStyleModel={model =>
              this.setState({ selectedStyleModel: model })
            }
          />
        </div>
        <div className={classes.buttons}>
          <ImageSelector
            selectFile={file => {
              this.setState(({ selectedImage }) => ({
                selectedImage: { ...selectedImage, file }
              }))

              fileToBase64(file).then(source => {
                this.setState(({ selectedImage }) => ({
                  selectedImage: { ...selectedImage, src: source }
                }))
              })
            }}
          />
          <Button
            variant="contained"
            component="span"
            className={classes.sendButton}
            onClick={this.sendFile}
          >
            Stylize
            <CloudUpload className={classes.rightIcon} />
          </Button>
        </div>
        {selectedImage.file && selectedImage.file.name && (
          <div className={classes.imageName}>{selectedImage.file.name}</div>
        )}
        <div className={classes.images}>
          {selectedImage.src && (
            <img
              src={selectedImage.src}
              alt="selectedImage"
              className={classes.image}
            />
          )}
          {imageStore.uploadedImageURL && (
            <img
              src={imageStore.uploadedImageURL}
              alt="stylizedImage"
              className={classes.image}
            />
          )}
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(inject("imageStore")(observer(ImageUploader)))
