const express = require('express')
const router = express.Router()
const analysisController = require('../controllers/analysis')
const authMiddleware = require('../middleware/auth')
const { rateLimit } = require('../middleware/rateLimit')

// Pattern Analysis
router.get(
  '/patterns',
  authMiddleware,
  rateLimit('standard'), // Using predefined standard limiter
  analysisController.analyzePatterns.bind(analysisController)
)

// Impact Predictions
router.post(
  '/predict-impact',
  authMiddleware,
  rateLimit('standard'), // Using predefined standard limiter
  analysisController.predictImpact.bind(analysisController)
)

// Insight Retrieval
router.get(
  '/insights',
  authMiddleware,
  rateLimit('standard'), // Using predefined standard limiter
  analysisController.getInsights.bind(analysisController)
)

// Report Generation (more restrictive rate limiting due to resource intensity)
router.post(
  '/report',
  authMiddleware,
  rateLimit('heavy'), // Using predefined heavy limiter
  analysisController.generateReport.bind(analysisController)
)

module.exports = router
