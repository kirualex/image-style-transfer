const path = require("path")
const fs = require("fs")
const spawn = require("child_process").spawn
const { Datastore } = require("@google-cloud/datastore")
const { Storage } = require("@google-cloud/storage")

const {
  getFilename,
  getFileExtension,
  getFileURL,
  getSourceImageURL,
  getTempModelPath,
  generateID,
  readFile
} = require("./helpers")
const events = require("../../events")
const { pubusb } = require("../../graphql/pubsub")

const bucketName = process.env.GCP_BUCKET_NAME
const projectId = process.env.GCP_PROJECT_ID

const styleTransferPath = path.resolve(process.cwd(), "style_transfer")
const stylizeScriptPath = path.resolve(styleTransferPath, "stylize_image.py")
const trainScriptPath = path.resolve(
  styleTransferPath,
  "style_transfer",
  "train.py"
)
const outputImagePath = path.resolve(styleTransferPath, "output")

process.env.PYTHONPATH = styleTransferPath

const gcpOptions = {
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: path.resolve(process.cwd(), "general-czar-keyfile.json")
}

function mapStyleModelToGraphQLType(model) {
  return {
    id: model[Datastore.KEY].id,
    name: model.name,
    filename: model.modelFilename,
    imageSrc: getSourceImageURL(model.imageFilename)
  }
}

async function findStyleModels() {
  try {
    const dataStore = new Datastore(gcpOptions)
    const query = dataStore.createQuery("StyleModel")
    const [models] = await dataStore.runQuery(query)

    if (!models) {
      return null
    }

    return models.map(model => mapStyleModelToGraphQLType(model))
  } catch (e) {
    console.error(e)
    return []
  }
}

async function saveStyleModel(name) {
  const dataStore = new Datastore(gcpOptions)
  const key = dataStore.key("StyleModel")

  const [result] = await dataStore.save({
    key,
    data: { name }
  })
  if (result.indexUpdates === 0) {
    throw new Error("Couldn't save style model")
  }
  // { kind: 'StyleModel', idType: 'id', id }
  const entityKey = result.mutationResults[0].key.path.find(
    ({ idType }) => idType === "id"
  )
  return entityKey
}

async function updateStyleModel(id, data) {
  const dataStore = new Datastore(gcpOptions)
  const key = dataStore.key(["StyleModel", id])

  const [result] = await dataStore.update({
    key,
    data
  })

  return result.indexUpdates > 0
}

async function removeStyleModel(id) {
  try {
    const styleModel = await findStyleModelById(id)
    if (!styleModel) {
      return null
    }
    const dataStore = new Datastore(gcpOptions)
    const key = dataStore.key(["StyleModel", parseInt(id, 10)])
    const [result] = await dataStore.delete(key)
    if (!result && result.mutationResults[0].indexUpdates === 0) {
      return null
    }
    const success = await removeFile("_models", styleModel.modelFilename)
    return success ? id : null
  } catch (e) {
    console.error(e)
    return null
  }
}

async function findStyleModelById(id) {
  try {
    const dataStore = new Datastore(gcpOptions)
    const key = dataStore.key(["StyleModel", parseInt(id, 10)])
    const [styleModel] = await dataStore.get(key)
    return styleModel
  } catch (e) {
    console.error(e)
    return null
  }
}

async function findImages(directory) {
  try {
    const storage = new Storage(gcpOptions)
    const [files] = await storage.bucket(bucketName).getFiles({
      directory
    })

    return files.map(file => {
      const filePath = file.name.split("/")
      const fileName = filePath.pop()
      return {
        id: file.id,
        name: fileName,
        modelId: filePath[1],
        imageURL: getFileURL(file.name)
      }
    })
  } catch (e) {
    console.error(e)
    return []
  }
}

async function uploadFile(directory, filename, buffer) {
  const storage = new Storage(gcpOptions)
  const bucket = await storage.bucket(bucketName)
  const imageID = generateID()
  const bucketImageName = `${imageID}-${filename}`
  const file = bucket.file(`${directory}/${bucketImageName}`)

  console.log(`Uploading file ${directory}/${bucketImageName}`)

  await file.save(buffer, {
    contentType: "image/jpeg"
  })

  await storage
    .bucket(bucketName)
    .file(`${directory}/${bucketImageName}`)
    .makePublic()

  console.log(`Made file ${directory}/${bucketImageName} public`)

  return {
    url: getFileURL(`${directory}/${bucketImageName}`),
    name: bucketImageName
  }
}

async function removeFile(directory, filename) {
  const storage = new Storage(gcpOptions)
  const bucket = await storage.bucket(bucketName)
  const file = bucket.file(`${directory}/${filename}`)
  await file.delete()
  return true
}

async function downloadModel(modelId) {
  const styleModel = await findStyleModelById(modelId)

  const storage = new Storage(gcpOptions)
  const outputPath = getTempModelPath(modelId)
  const downloadOptions = {
    destination: outputPath
  }
  await storage
    .bucket(bucketName)
    .file(`_models/${styleModel.modelFilename}`)
    .download(downloadOptions)
}

function stylizeImage(file, modelId) {
  return new Promise(async (resolve, reject) => {
    const fileName = getFilename(file)
    const fileExt = getFileExtension(file)
    const inputFilePath = `${process.cwd()}/${file.path}`
    const outputFileNameWithExt = `${fileName}_output.${fileExt}`
    const outputFilePath = `${outputImagePath}/${outputFileNameWithExt}`

    const modelPath = getTempModelPath(modelId)
    fs.exists(modelPath, async exists => {
      if (!exists) {
        await downloadModel(modelId)
      }
    })

    const proc = spawn("python", [
      stylizeScriptPath,
      `--input-image`,
      inputFilePath,
      `--output-image`,
      outputFilePath,
      `--model-checkpoint`,
      modelPath
    ])

    let data
    proc.stdout.on("data", d => {
      data += d
    })

    let err
    proc.stderr.on("data", e => {
      err += e
    })

    proc.on("close", (code, signal) => {
      resolve({
        success: code !== 1,
        file: { path: outputFilePath, name: outputFileNameWithExt },
        err
      })
    })
  })
}

function trainModel({ filePath, modelId, iterations, onData }) {
  return new Promise(async (resolve, reject) => {
    const inputFilePath = `${process.cwd()}/${filePath}`

    const modelPath = getTempModelPath(modelId)

    const proc = spawn("python", [
      trainScriptPath,
      "--training-image-dset",
      path.resolve(styleTransferPath, "example", "training_images.tfrecord"),
      "--style-images",
      inputFilePath,
      "--model-checkpoint",
      modelPath,
      "--image-size",
      "256,256",
      "--alpha",
      "0.25",
      "--log-interval",
      "1",
      "--num-iterations",
      iterations
    ])

    // let data
    // proc.stdout.on("data", d => {
    //   data += d
    // })

    let err
    proc.stderr.on("data", d => {
      onData(d)
      err += d
    })

    proc.on("close", (code, signal) => {
      const success = code !== 1
      resolve({
        success,
        modelPath,
        err
      })
    })
  })
}

module.exports = {
  findStyleModels,
  findStyleModelById,
  mapStyleModelToGraphQLType,
  stylizeImage,
  trainModel,
  saveStyleModel,
  updateStyleModel,
  removeStyleModel,
  downloadModel,
  uploadFile,
  findImages
}
