import { observable, action, decorate } from 'mobx'

export class ImageStore {
  uploadedImageURL = ''

  setUploadedImage(imageURL) {
    this.uploadedImageURL = imageURL
  }
}

decorate(ImageStore, {
  uploadedImageURL: observable,
  setUploadedImage: action.bound
})
