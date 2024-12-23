import { Server as HttpServer } from 'http'

import { Server } from 'socket.io'
import { getDB } from '~/config/mongodb'

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    /* options */
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  })

  io.on('connection', async (socket) => {
    console.log('User connected:', socket.id)
    const auth = socket.handshake.query.auth === 'true'
    auth ? socket.join('auth') : socket.join('client')

    socket.on('data', async (data) => {
      const db = getDB()
      const collection = db.collection('data')
      const result = await collection.insertOne({
        ...data,
        date: new Date()
      })
      const newData = await collection.findOne({
        _id: result.insertedId
      })
      io.to('auth').emit('data-update', newData)
    })
    socket.on('connect_error', (err) => {
      console.log('Connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${reason}`)
    })
  })
}
