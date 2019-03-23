import React from "react"
import { withStyles, Button } from "@material-ui/core"
import { CloudUpload } from "@material-ui/icons"
import { Query } from "react-apollo"
import gql from "graphql-tag"
import { observer } from "mobx-react-lite"

import { uploadImage, fileToBase64 } from "../../api"
import StyleModelSelector from "../StyleModelSelector"
import ImageSelector from "../ImageSelector"
import { ImageStoreContext } from "../../stores/ImageStore"

const STYLES_QUERY = gql`
  query styleModels {
    styleModels {
      id
      name
      filename
      imageSrc
    }
  }
`

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

function ImageUploader(props) {
  const { classes } = props
  const [selectedImage, selectImage] = React.useState({
    file: null,
    src: ""
  })
  const [selectedStyleModel, selectStyleModel] = React.useState(null)
  const imageStore = React.useContext(ImageStoreContext)

  return (
    <div className={classes.root}>
      <Query
        query={STYLES_QUERY}
        onCompleted={({ styleModels }) => {
          if (!selectedStyleModel) {
            selectStyleModel(styleModels[0])
          }
        }}
      >
        {({ data }) => (
          <div>
            <StyleModelSelector
              styleModels={data.styleModels || []}
              selectedStyleModel={selectedStyleModel}
              selectStyleModel={model => {
                selectStyleModel(model)
              }}
            />
          </div>
        )}
      </Query>
      <div className={classes.buttons}>
        <ImageSelector
          selectFile={file => {
            selectImage(selectedImage => ({ ...selectedImage, file }))

            fileToBase64(file).then(source => {
              selectImage(selectedImage => ({ ...selectedImage, src: source }))
            })
          }}
        />
        <Button
          variant="contained"
          component="span"
          className={classes.sendButton}
          onClick={() => {
            if (selectedImage.file) {
              uploadImage(selectedImage.file, selectedStyleModel.id)
            }
          }}
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

export default withStyles(styles)(observer(ImageUploader))
