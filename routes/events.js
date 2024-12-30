const express = require('express')
const router = express.Router()
const eventsController = require('../controllers/events')
const authMiddleware = require('../middleware/auth')

// GET all events
router.get('/', authMiddleware, eventsController.getAllEvents)

// GET single event by ID
router.get('/:id', authMiddleware, eventsController.getEventById)

// POST create new event
router.post('/', authMiddleware, eventsController.createEvent)

// PUT update event
router.put('/:id', authMiddleware, eventsController.updateEvent)

// DELETE event
router.delete('/:id', authMiddleware, eventsController.deleteEvent)

module.exports = router
