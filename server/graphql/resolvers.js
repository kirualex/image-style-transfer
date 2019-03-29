const { findStyleModels } = require("../models/style")
const events = require("../events")
const { pubsub } = require("./pubsub")

module.exports = {
  Event: {
    __resolveType: event => {
      switch (event.name) {
        case events.UPLOAD_SUCCEEDED:
          return "UploadSucceededEvent"
        case events.MODEL_TRAINING_ITERATION_COMPLETED:
          return "ModelTrainingIterationCompletedEvent"
        case events.MODEL_TRAINING_STARTED:
          return "ModelTrainingStartedEvent"
        case events.MODEL_TRAINING_COMPLETED:
          return "ModelTrainingCompletedEvent"
        case undefined:
          throw new Error(`Event name is missing: JSON.stringify(data)`)
        default:
          return "GenericEvent"
      }
    }
  },
  Query: {
    styleModels: async (root, variables, context) => {
      return findStyleModels()
    }
  },
  Subscription: {
    styleTransferEvent: {
      subscribe: () => pubsub.asyncIterator("styleTransferEvent")
    },
    modelTrainingEvent: {
      subscribe: () => pubsub.asyncIterator("modelTrainingEvent")
    }
  }
}
