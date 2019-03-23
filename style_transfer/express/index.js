require('./setupEnvironment')
const express = require("express")
const cors = require("cors")
const formidable = require("express-formidable")
const bodyParser = require('body-parser')

const { stylizeImage, uploadImage, getStylingModels } = require("./helpers")
const WebSocket = require("ws")
const { ws } = require("./ws")

const PORT = 3001

const app = express()

app.use(cors())
app.use("/image", bodyParser.urlencoded({ extended: false }))
app.use(
  "/image",
  formidable({
    encoding: "utf-8",
    uploadDir: "./temp",
    multiples: false
  })
)

app.get("/stylemodels", async (req, res) => {
  // TODO: save models somewhere.
  // Including the source image and the actual model.
  // Or maybe just source image, model name and file name.
  const models = await getStylingModels()
  res.status(200).json(JSON.stringify(models))
})

// need an ID from client so events can be sent to the correct websocket
app.post("/image", async (req, res) => {
  const { files, fields } = req
  const { modelId } = fields

  const { file } = files
  const filePath = file.path
  const fileName = file.name


  let client
  ws.clients.forEach(c => {
    if (c !== ws && c.readyState === WebSocket.OPEN) {
      client = c
    }
  })

  res.status(200).send("ok")

  const event = {
    type: "STYLIZE_STARTED",
    message: "Image stylizing started"
  }

  client.send(JSON.stringify(event))

  // const { model } = body

  try {
    const result = await stylizeImage(file, modelId)
    if (result.code === 1) {
      const errorEvent = {
        type: "STYLIZE_ERROR",
        error: result.err,
        message: result.err.message
      }
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(errorEvent))
      }
    } else {
      const stylizeSuccessEvent = {
        type: "STYLIZE_SUCCESS",
        message: "Stylizing was successful"
      }
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(stylizeSuccessEvent))
      }
      const imageURL = await uploadImage(result.file.name, result.file.path)
      const uploadSuccessEvent = {
        type: "UPLOAD_SUCCESS",
        message: "Image upload was successful",
        imageURL
      }
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(uploadSuccessEvent))
      }
      }
  } catch (e) {
    const errorEvent = {
      type: "STLIZE_ERROR",
      error: e,
      message: e.message
    }
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(errorEvent))
    }
  }
})

app.listen(PORT, () => console.log(`App listening on ${PORT}`))
