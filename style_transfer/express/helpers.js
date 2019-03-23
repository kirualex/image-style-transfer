const fs = require("fs")
const path = require("path")
const request = require("request")
const spawn = require("child_process").spawn
const { Storage } = require("@google-cloud/storage")
const { Datastore } = require("@google-cloud/datastore")

const { ws } = require("./ws")

const projectPath = "/home/smappa/code/event-thing"
const bucketName = process.env.GCP_BUCKET_NAME
const projectId = process.env.GCP_PROJECT_ID
const keyFilePath = `${projectPath}/style_transfer/express/general-czar-keyfile.json`

const stylizeScriptPath = `${projectPath}/style_transfer/stylize_image.py`

const expressImagePath = `${projectPath}/style_transfer/express`
const inputImagePath = `${projectPath}/style_transfer/example`
const outputImagePath = `${projectPath}/style_transfer/output`

const gcpOptions = {
  projectId,
  keyFilename: keyFilePath
}

function getModelPath(filename) {
  if (!filename) {
    return `${projectPath}/style_transfer/example/starry_night.h5` 
  }
  return `${projectPath}/style_transfer/example/${filename}`
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
  return `${projectPath}/style_transfer/express/temp/${modelId}.h5`
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
    const inputFilePath = `${expressImagePath}/${filePath}`
    const outputFileNameWithExt = `${fileName}_output.${fileExt}`
    const outputFilePath = `${inputImagePath}/${outputFileNameWithExt}`

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
      resolve({ code, file: { path: outputFilePath, name: outputFileNameWithExt }, err })
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

async function getStylingModels() {
  const dataStore = new Datastore(gcpOptions)
  const query = dataStore.createQuery('StyleModel')
  const [models] = await dataStore.runQuery(query)
  
  return models.map(model => {
    return {
      id: model[dataStore.KEY].id,
      name: model.name,
      imageSrc: getSourceImageURL(model.imageFilename)
    }
  })
}

module.exports = { uploadImage, stylizeImage, getStylingModels }
