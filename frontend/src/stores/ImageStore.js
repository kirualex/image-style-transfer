import React from 'react'
import { observable, action, decorate } from 'mobx'

class ImageStore {
  uploadedImageURL = ''
  selectedImage = null

  selectImage(image) {
    this.selectedImage = image
  }

  setUploadedImage(imageURL) {
    this.uploadedImageURL = imageURL
  }
}

decorate(ImageStore, {
  selectedImage: observable,
  selectImage: action.bound,
  uploadedImageURL: observable,
  setUploadedImage: action.bound
})

const imageStore = new ImageStore()

export const ImageStoreContext = React.createContext(imageStore)
