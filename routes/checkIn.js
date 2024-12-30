const express = require('express')
const router = express.Router()
const checkInController = require('../controllers/checkIn')
const authMiddleware = require('../middleware/auth')
const { rateLimit } = require('../middleware/rateLimit')

// Rate limiting configuration
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})

const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
})

// CRUD Operations
router.post('/', authMiddleware, createLimiter, checkInController.create)
router.get('/:id', authMiddleware, getLimiter, checkInController.get)
router.get('/', authMiddleware, getLimiter, checkInController.list)
router.put('/:id', authMiddleware, createLimiter, checkInController.update)
router.delete('/:id', authMiddleware, createLimiter, checkInController.delete)

// Analysis Endpoints
router.get(
  '/patterns',
  authMiddleware,
  getLimiter,
  checkInController.getPatterns
)
router.post(
  '/predict-impact',
  authMiddleware,
  createLimiter,
  checkInController.predictImpact
)

// Batch Operations
router.post(
  '/batch',
  authMiddleware,
  createLimiter,
  checkInController.batchCreate
)

// Export functionality
router.get('/export', authMiddleware, getLimiter, checkInController.export)

module.exports = router
