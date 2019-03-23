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

const bucketName = process.env.GCP_BUCKET_NAME
const projectId = process.env.GCP_PROJECT_ID

const styleTransferPath = path.resolve(process.cwd(), "style_transfer")

const stylizeScriptPath = path.resolve(styleTransferPath, "stylize_image.py")

const outputImagePath = path.resolve(styleTransferPath, "output")

const gcpOptions = {
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: path.resolve(process.cwd(), "general-czar-keyfile.json")
}

async function findStyleModels() {
  const dataStore = new Datastore(gcpOptions)
  const query = dataStore.createQuery("StyleModel")
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

async function findStyleModelById(modelId) {
  const dataStore = new Datastore(gcpOptions)
  const id = parseInt(modelId, 10)
  const key = dataStore.key(["StyleModel", id])
  const [styleModel] = await dataStore.get(key)
  return styleModel
}

async function uploadImage(fileName, inputFilePath) {
  // const { stream, filename, mimetype, encoding } = await file

  let buffer
  try {
    buffer = await readFile(inputFilePath)
  } catch (e) {
    console.error(e)
    return
  }

  const storage = new Storage(gcpOptions)

  const bucket = await storage.bucket(bucketName)
  // await bucket.upload(inputFilePath)
  const modelName = "default"
  const imageID = generateID()
  const bucketImageName = `${imageID}-${fileName}`
  const file = bucket.file(`${modelName}/${bucketImageName}`)

  console.log(`Uploading file ${bucketImageName} (model: ${modelName})`)

  await file.save(buffer, {
    contentType: "image/jpeg" // mimetype
  })
  // stream.on('end', () => {
  //   console.log(`Upload finished for file ${fileName} (model: ${modelName})`)
  // })

  // const blobStream = file.createWriteStream({
  //   metadata: {
  //     contentType: 'image/jpeg' // mimetype
  //   }
  // })

  // stream.pipe(blobStream)

  // stream.on('error', err => {
  //   console.log('Error while writing file to storage: ', err)
  // })

  await storage
    .bucket(bucketName)
    .file(`${modelName}/${bucketImageName}`)
    .makePublic()

  console.log(`Made file ${bucketImageName} (model: ${modelName}) public`)

  return getFileURL(bucketImageName, modelName)
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

module.exports = { findStyleModels, stylizeImage, downloadModel, uploadImage }
