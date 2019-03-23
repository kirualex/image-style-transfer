import React from "react"
import { withStyles, Button } from "@material-ui/core"
import { CloudUpload } from "@material-ui/icons"
import { Query, Subscription } from "react-apollo"
import gql from "graphql-tag"
import { observer } from "mobx-react-lite"
import { BarLoader } from 'react-spinners'

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

const STYLE_TRANSFER_EVENT_SUBSCRIPTION = gql`
  subscription styleTransferEvent {
    styleTransferEvent {
      name
      message
      ... on UploadSucceededEvent {
        imageURL
      }
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
  },
  loadWrapper: {
    minHeight: 10,
    margin: 10
  }
})

function ImageUploader({ classes }) {
  const [loading, setLoading] = React.useState(false)
  const [selectedImage, selectImage] = React.useState({
    file: null,
    src: ""
  })
  const [selectedStyleModel, selectStyleModel] = React.useState(null)
  const imageStore = React.useContext(ImageStoreContext)

  return (
    <Subscription
      subscription={STYLE_TRANSFER_EVENT_SUBSCRIPTION}
      onSubscriptionData={({ subscriptionData: { data } }) => {
        const { styleTransferEvent } = data
        if (styleTransferEvent.name === "UPLOAD_SUCCEEDED") {
          imageStore.setUploadedImage(styleTransferEvent.imageURL)
        }
        if (styleTransferEvent.name === 'STYLIZE_STARTED') {
          setLoading(true)
        }
        if (['UPLOAD_SUCCEEDED', 'STYLIZE_ERROR'].includes(styleTransferEvent.name)) {
          setLoading(false)
        }
      }}
    >
      {() => (
        <div className={classes.root}>
          <div className={classes.loadWrapper}>
            {loading && <BarLoader width={100} widthUnit="%" />}
          </div>
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
                  styleModels={(data && data.styleModels) || []}
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
              disabled={loading}
              selectFile={file => {
                selectImage(selectedImage => ({ ...selectedImage, file }))

                fileToBase64(file).then(source => {
                  selectImage(selectedImage => ({
                    ...selectedImage,
                    src: source
                  }))
                })
              }}
            />
            <Button
              variant="contained"
              component="span"
              disabled={!selectedImage.file || !selectedStyleModel || loading}
              className={classes.sendButton}
              onClick={() => {
                uploadImage(selectedImage.file, selectedStyleModel.id)
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
      )}
    </Subscription>
  )
}

export default withStyles(styles)(observer(ImageUploader))
