import express from 'express'
import { createServer } from 'http'
import { initSocket } from './socket'
import cors from 'cors'
import { getDB } from './config/mongodb'
const app = express()

const httpServer = createServer(app)
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('Hello, World!')
})

app.get('/api/analyze/:date', async (req, res) => {
  try {
    const { date } = req.params
    const currentTime = new Date(date ?? Date.now())
    const startOfDay = new Date(currentTime)
    startOfDay.setHours(0, 0, 0, 0) // Đầu ngày

    const endOfDay = new Date(currentTime)
    endOfDay.setHours(23, 59, 59, 999) // Cuối ngày

    const db = getDB()
    const collection = db.collection('data')
    const result = await collection
      .find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .toArray()
    res.status(200).json(result)
  } catch (error) {
    console.error(error)
    res.status(500).send('Internal Server Error')
  }
})

initSocket(httpServer)
export default httpServer
