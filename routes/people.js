const express = require('express')
const router = express.Router()
const peopleController = require('../controllers/people')
const authMiddleware = require('../middleware/auth')

router.get('/', authMiddleware, peopleController.getAllPeople)
router.get('/:id', authMiddleware, peopleController.getPersonById)
router.post('/', authMiddleware, peopleController.createPerson)

module.exports = router
