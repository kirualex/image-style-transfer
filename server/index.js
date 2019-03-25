require("./setupEnvironment")
const http = require("http")
const express = require("express")
const cors = require("cors")
const formidable = require("express-formidable")
const bodyParser = require("body-parser")

const {
  saveStyleModel,
  updateStyleModel,
  stylizeImage,
  uploadFile,
  trainModel
} = require("./models/style")
const { readFile } = require("./models/style/helpers")
const { createGraphQLServer } = require("./graphql")
const { pubsub } = require("./graphql/pubsub")
const events = require("./events")

const PORT = 3001

const app = express()

app.use(cors())
app.use("/trainmodel", bodyParser.urlencoded({ extended: false }))
app.use("/styleimage", bodyParser.urlencoded({ extended: false }))
app.use(
  "/trainmodel",
  formidable({
    encoding: "utf-8",
    uploadDir: "./temp",
    multiples: false
  })
)
app.use(
  "/styleimage",
  formidable({
    encoding: "utf-8",
    uploadDir: "./temp",
    multiples: false
  })
)

app.post("/trainmodel", async (req, res) => {
  const { files, fields } = req
  const { modelName, fileExtension } = fields

  const { file } = files
  const parts = file.name.split(".")
  const ext = parts[parts.length - 1]

  res.status(200).send("ok")

  const { kind, id } = await saveStyleModel(modelName)
  const modelPreviewImageFileName = `${id}.${ext}`

  pubsub.publish('modelTrainingEvent', {
    modelTrainingEvent: {
      name: events.MODEL_TRAINING_STARTED,
      message: "Style model training started"
    }
  })

  try {
    let imageBuffer
    try {
      imageBuffer = await readFile(file.path)
    } catch (e) {
      throw e
    }
    const { url, name: imageFilename } = await uploadFile(
      "_model-source-images",
      modelPreviewImageFileName,
      imageBuffer
    )

    const iterations = 5
    const result = await trainModel({
      filePath: file.path,
      modelId: id,
      iterations,
      onData: data => {
        const message = data.toString()
        if (message.match(/Training Update/)) {
          const rxp = new RegExp(/(Step: .*)/g)
          const [stepsString] = message.match(rxp)
          if (stepsString) {
            let steps = stepsString.replace("Step: ", "")
            steps = parseInt(steps, 10) + 1 //starts from 0

            pubsub.publish('modelTrainingEvent', {
              modelTrainingEvent: {
                name: events.MODEL_TRAINING_ITERATION_COMPLETED,
                currentIteration: steps,
                maxIterations: iterations,
                message: `${steps}/${iterations} iterations completed`
              }
            })
          }
          console.log("ERR", message)
        }
        if (message.match(/train_network:Done/)) {
          console.log("ERR", message)
        }
      }
    })

    if (!result.success) {
      throw result.err
    }

    pubsub.publish('modelTrainingEvent', {
      modelTrainingEvent: {
        name: events.MODEL_TRAINING_COMPLETED,
        message: "Style model training completed"
      }
    })

    let modelBuffer
    try {
      modelBuffer = await readFile(result.modelPath)
    } catch (e) {
      throw e
    }

    const { name: modelFilename } = await uploadFile(
      "_models",
      modelPreviewImageFileName,
      modelBuffer
    )

    await updateStyleModel(parseInt(id, 10), {
      modelFilename,
      imageFilename,
      name: modelName
    })
    // MODEL_TRAINING_SUCCEEDED
    // pubsub.publish("styleTransferEvent", {
    //   styleTransferEvent: {
    //     name: events.UPLOAD_SUCCEEDED,
    //     message: "Image upload was successful",
    //     imageURL
    //   }
    // })
  } catch (err) {
    pubsub.publish({
      trainingEvent: {
        name: events.MODEL_TRAINING_ERROR,
        message: err.message
      }
    })
  }
})

app.post("/styleimage", async (req, res) => {
  const { files, fields } = req
  const { modelId } = fields

  const { file } = files

  res.status(200).send("ok")

  pubsub.publish("styleTransferEvent", {
    styleTransferEvent: {
      name: events.STYLIZE_STARTED,
      message: "Image stylizing started"
    }
  })

  try {
    const result = await stylizeImage(file, modelId)
    if (!result.success) {
      throw new Error(result.err)
    }

    pubsub.publish("styleTransferEvent", {
      styleTransferEvent: {
        name: events.STYLIZE_SUCCEEDED,
        message: "Image stylizing succeeded"
      }
    })

    let buffer
    try {
      buffer = await readFile(result.file.ath)
    } catch (e) {
      throw e
    }
    const { url } = await uploadFile("default", result.file.name, buffer)

    pubsub.publish("styleTransferEvent", {
      styleTransferEvent: {
        name: events.UPLOAD_SUCCEEDED,
        message: "Image upload was successful",
        imageURL: url
      }
    })
  } catch (err) {
    pubsub.publish("styleTransferEvent", {
      styleTransferEvent: {
        name: events.STYLIZE_ERROR,
        message: err.message
      }
    })
  }
})

const httpServer = http.createServer(app)
const apolloServer = createGraphQLServer(app, httpServer)

httpServer.listen(PORT, () => {
  console.log("Express listening on port 4001")
  console.log(
    `Apollo Server listening on port 4001 ${apolloServer.graphqlPath}`
  )
})
