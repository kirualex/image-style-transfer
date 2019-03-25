const path = require('path')
const fs = require('fs')

const bucketName = process.env.GCP_BUCKET_NAME
const styleTransferPath = path.resolve(process.cwd(), "style_transfer")

// function getModelPath(filename) {
//   if (!filename) {
//     console.warn('getModelPath: no model specified, using starry_night by default')
//     return path.resolve(styleTransferPath, 'example', 'starry_night.h5')
//   }
//   return path.resolve(styleTransferPath, 'example', filename)
// }

function getFilename(file) {
  let parts = file.name.split(".")
  parts.pop()
  return parts.join("")
}

function getFileExtension(file) {
  let parts = file.name.split(".")
  return parts.pop()
}

function getFileURL(fileName, modelName) {
  return `https://storage.googleapis.com/${bucketName}/${modelName}/${fileName}`
}

function getSourceImageURL(imageFilename) {
  return `https://storage.cloud.google.com/${bucketName}/_model-source-images/${imageFilename}`
}

function getTempModelPath(modelId) {
  return path.resolve(process.cwd(), 'temp', `${modelId}.h5`)
}

function generateID() {
  return Date.now().toString()
}

function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

module.exports = {
  getFilename,
  getFileExtension,
  getFileURL,
  getSourceImageURL,
  getTempModelPath,
  generateID,
  readFile
}
