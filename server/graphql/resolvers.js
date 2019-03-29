const {
  findStyleModels,
  findStyleModelById,
  sfindImages,
  mapStyleModelToGraphQLType
} = require("../models/style")
const events = require("../events")
const { pubsub } = require("./pubsub")

function onlyIdFieldSelected(selections) {
  const hasId = selections.some(
    node =>
      node.kind === "Field" &&
      (node.name.value === "id" || node.name.value === "_id")
  )
  // length is 2 because of __typename
  return hasId && selections.length === 2
}

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
  Image: {
    model: async (root, variables, context, info) => {
      const modelField = info.fieldNodes.find(
        node => node.kind === "Field" && node.name.value === "model"
      )
      if (onlyIdFieldSelected(modelField.selectionSet.selections)) {
        return { id: root.modelId }
      }
      const model = await findStyleModelById(root.modelId)
      return mapStyleModelToGraphQLType(model)
    }
  },
  Query: {
    styleModels: () => {
      return findStyleModels()
    },
    styledImages: () => {
      return findImages("styled")
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
