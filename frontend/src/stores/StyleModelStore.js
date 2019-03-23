import React from "react"
import { observable, action, decorate } from "mobx"

class StyleModelStore {
  selectedStyleModel = null

  selectStyleModel(model) {
    this.selectedStyleModel = model
  }
}

decorate(StyleModelStore, {
  selectedStyleModel: observable,
  selectStyleModel: action.bound
})

const styleModelStore = new StyleModelStore()

export const StyleModelStoreContext = React.createContext(styleModelStore)
