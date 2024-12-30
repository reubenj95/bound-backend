const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const {
  getSocialCircles,
  getSocialCircle,
  createSocialCircle,
  updateSocialCircle,
  deleteSocialCircle,
  addMember,
  removeMember,
} = require('../controllers/socialCircles')

// Get all social circles
router.get('/', authMiddleware, getSocialCircles)

// Get a specific social circle
router.get('/:id', authMiddleware, getSocialCircle)

// Create a new social circle
router.post('/', authMiddleware, createSocialCircle)

// Update a social circle
router.put('/:id', authMiddleware, updateSocialCircle)

// Delete a social circle
router.delete('/:id', authMiddleware, deleteSocialCircle)

// Add a member to a social circle
router.post('/:id/members', authMiddleware, addMember)

// Remove a member from a social circle
router.delete('/:id/members/:personId', authMiddleware, removeMember)

module.exports = router
