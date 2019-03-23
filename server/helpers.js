const fs = require("fs")
const path = require("path")
const spawn = require("child_process").spawn
const { Storage } = require("@google-cloud/storage")
const { Datastore } = require("@google-cloud/datastore")

const bucketName = process.env.GCP_BUCKET_NAME
const projectId = process.env.GCP_PROJECT_ID
const keyFilePath = path.resolve(process.cwd(), 'general-czar-keyfile.json')

const styleTransferPath = path.resolve(process.cwd(), 'style_transfer')

const stylizeScriptPath = path.resolve(styleTransferPath, 'stylize_image.py')

const inputImagePath = path.resolve(styleTransferPath, 'example')
const outputImagePath = path.resolve(styleTransferPath, 'output')

const gcpOptions = {
  projectId,
  keyFilename: keyFilePath
}

function getModelPath(filename) {
  if (!filename) {
    console.warn('getModelPath: no model specified, using starry_night by default')
    return path.resolve(styleTransferPath, 'example', 'starry_night.h5')
  }
  return path.resolve(styleTransferPath, 'example', filename)
}

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
  return `https://storage.googleapis.com/${bucketName}/_model-source-images/${imageFilename}`
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

async function findStyleModelById(modelId) {
  const dataStore = new Datastore(gcpOptions)
  const id = parseInt(modelId, 10)
  const key = dataStore.key(['StyleModel', id])
  const [styleModel] = await dataStore.get(key)
  return styleModel
}

function getTempModelPath(modelId) {
  return path.resolve(process.cwd(), 'temp', `${modelId}.h5`)
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
    const filePath = file.path
    const fileName = getFilename(file)
    const fileExt = getFileExtension(file)
    const inputFilePath = `${process.cwd()}/${filePath}`
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
      `--input-image`, inputFilePath,
      `--output-image`, outputFilePath,
      `--model-checkpoint`, modelPath
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
      resolve({ success: code !== 1, file: { path: outputFilePath, name: outputFileNameWithExt }, err })
    })
  })
}

async function uploadImage(fileName, filePath) {
  // const { stream, filename, mimetype, encoding } = await file

  let buffer
  try {
    buffer = await readFile(filePath)
  } catch (e) {
    console.error(e)
    return
  }

  const storage = new Storage(gcpOptions)

  const bucket = await storage.bucket(bucketName)
  // await bucket.upload(filePath)
  const modelName = 'default'
  const imageID = generateID()
  const bucketImageName = `${imageID}-${fileName}`
  const file = bucket.file(`${modelName}/${bucketImageName}`)

  console.log(`Uploading file ${bucketImageName} (model: ${modelName})`)

  await file.save(buffer, {
    contentType: 'image/jpeg' // mimetype
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

module.exports = { uploadImage, stylizeImage, getSourceImageURL }
