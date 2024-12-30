const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const path = require('path')

// Import routes
const checkInRoutes = require('./routes/checkIn')
const {
  router: notificationRoutes,
  setupWebSocket,
} = require('./routes/notification')
const analysisRoutes = require('./routes/analysis')
const authRoutes = require('./routes/auth')
const eventsRoutes = require('./routes/events')

// Import middleware
const authenticate = require('./middleware/auth')
const { rateLimit } = require('./middleware/rateLimit')

// Create Express app
const app = express()

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'))

// Middleware
app.use(helmet()) // Security headers
app.use(cors()) // Enable CORS
app.use(compression()) // Compress responses
app.use(express.json()) // Parse JSON bodies
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded bodies

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Global rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
  })
)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/check-ins', authenticate, checkInRoutes)
app.use('/api/notifications', authenticate, notificationRoutes)
app.use('/api/analysis', authenticate, analysisRoutes)
app.use('/api/events', authenticate, eventsRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
    })
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access',
    })
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  })
})

// Start server
const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Setup WebSocket server
const wss = setupWebSocket(server)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    // Close WebSocket server
    wss.close(() => {
      console.log('WebSocket server closed')
      process.exit(0)
    })
  })
})

module.exports = { app, server, wss }
