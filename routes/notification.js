const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notification')
const authMiddleware = require('../middleware/auth')
const { rateLimit } = require('../middleware/rateLimit')

// Rate limiting configuration
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
})

const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
})

// Notification Management
router.post(
  '/',
  authMiddleware,
  standardLimiter,
  notificationController.create.bind(notificationController)
)
router.get(
  '/pending/:userId',
  authMiddleware,
  getLimiter,
  notificationController.getPending.bind(notificationController)
)

// Preference Management
router.put(
  '/preferences/:userId',
  authMiddleware,
  standardLimiter,
  notificationController.updatePreferences.bind(notificationController)
)

// Channel Configuration
router.get(
  '/channels/:userId',
  authMiddleware,
  getLimiter,
  notificationController.getChannelConfig.bind(notificationController)
)
router.put(
  '/channels/:userId',
  authMiddleware,
  standardLimiter,
  notificationController.updateChannelConfig.bind(notificationController)
)

// Push Notification Management
router.post(
  '/push/register',
  authMiddleware,
  standardLimiter,
  notificationController.registerPushToken.bind(notificationController)
)
router.post(
  '/push/unregister',
  authMiddleware,
  standardLimiter,
  notificationController.unregisterPushToken.bind(notificationController)
)

// WebSocket setup function for server.js
const setupWebSocket = (server) => {
  const WebSocket = require('ws')
  const wss = new WebSocket.Server({ server, path: '/ws/notifications' })

  wss.on('connection', (ws, req) => {
    notificationController.handleWebSocket(ws, req)
  })

  // Heartbeat to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate()
      ws.isAlive = false
      ws.ping(() => {})
    })
  }, 30000)

  wss.on('close', () => {
    clearInterval(interval)
  })

  return wss
}

module.exports = {
  router,
  setupWebSocket,
}
