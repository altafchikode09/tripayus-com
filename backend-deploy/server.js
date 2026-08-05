import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import rateLimit from 'express-rate-limit'

import { connectDB, prisma } from './src/db.js'

// ========================
// ROUTE IMPORTS (Batch 1)
// ========================
import authRoutes from './src/routes/authRoutes.js'
import dealRoutes from './src/routes/dealRoutes.js'
import documentRoutes from './src/routes/documentRoutes.js'
import auditRoutes from './src/routes/auditRoutes.js'

// ========================
// APP SETUP
// ========================
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
})

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

// Static uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'))

// Attach io to every request for real-time notifications
app.use((req, res, next) => {
  req.io = io
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV })
})

// ========================
// API ROUTES (Batch 1)
// ========================
app.use('/api/auth', authRoutes)
app.use('/api/deals', dealRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/audit', auditRoutes)

// ========================
// 404 Handler
// ========================
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path })
})

// ========================
// Global Error Handler
// ========================
app.use((err, req, res, next) => {
  console.error('[ERROR]', err)
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// ========================
// WEBSOCKET (Real-time)
// ========================
io.on('connection', (socket) => {
  console.log('🔌 WS connected:', socket.id)

  socket.on('auth', (token) => {
    if (token) socket.join(`user:${token}`)
  })

  socket.on('join-deal', (dealId) => {
    socket.join(`deal:${dealId}`)
    socket.to(`deal:${dealId}`).emit('user:joined', { socketId: socket.id })
  })

  socket.on('cursor-move', (data) => {
    socket.to(`deal:${data.dealId}`).emit('cursor:update', {
      userId: data.userId,
      x: data.x,
      y: data.y,
      documentId: data.documentId
    })
  })

  socket.on('typing', (data) => {
    socket.to(`deal:${data.dealId}`).emit('user:typing', {
      userId: data.userId,
      documentId: data.documentId
    })
  })

  socket.on('disconnect', () => {
    console.log('🔌 WS disconnected:', socket.id)
  })
})

// ========================
// GRACEFUL SHUTDOWN
// ========================
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await prisma.$disconnect()
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 3001
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Tripay AI Server running on port ${PORT}`)
    console.log(`📡 WebSocket ready`)
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
})

export { io }
