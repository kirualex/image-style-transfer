import React from 'react'
import { observable, action, decorate } from 'mobx'

class ImageStore {
  uploadedImageURL = ''

  setUploadedImage(imageURL) {
    this.uploadedImageURL = imageURL
  }
}

decorate(ImageStore, {
  uploadedImageURL: observable,
  setUploadedImage: action.bound
})

const imageStore = new ImageStore()

export const ImageStoreContext = React.createContext(imageStore)
