import axios from 'axios'

export const uploadImage = (file, modelId) => {
  let data = new FormData()
  data.append('file', file, file.name)
  data.append('modelId', modelId)
  // return axios.post('http://localhost:3001/image', data)
  //   .then(res => ({ error: false, message: 'Success!' }))
  //   .catch(error => ({ error: true, message: 'Error!' }))

  return axios.post('http://localhost:3001/image', data)
    .then(({ data }) => ({
      image: data,
      error: false,
      message: 'Success!'
    }))
    .catch(error => ({ error: true, message: 'Error!' }))
}

export const fileToBase64 = file => new Promise((resolve, reject) => {
  try {
    const fr = new FileReader()
    fr.readAsDataURL(file)
    fr.onload = () => resolve(fr.result)
    fr.onerror = err => reject('Error while converting file to base64 string')
  } catch (e) {
    reject('Error while converting file to base64 string')
  }
})
