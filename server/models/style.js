const path = require('path')
const { Datastore } = require('@google-cloud/datastore')
const { getSourceImageURL } = require('../helpers')

const gcpOptions = {
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: path.resolve(process.cwd(), 'general-czar-keyfile.json')
}

async function findStyleModels() {
  const dataStore = new Datastore(gcpOptions)
  const query = dataStore.createQuery('StyleModel')
  const [models] = await dataStore.runQuery(query)

  if (!models) {
    return null
  }

  return models.map(model => {
    return {
      id: model[dataStore.KEY].id,
      name: model.name,
      filename: model.modelFilename,
      imageSrc: getSourceImageURL(model.imageFilename)
    }
  })
}

module.exports = { findStyleModels }
