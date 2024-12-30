const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Check if user already exists
    const existingUser = await db('users')
      .where({ email })
      .orWhere({ username })
      .first()

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email or username already exists',
      })
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create new user
    const [user] = await db('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
      })
      .returning(['id', 'username', 'email'])

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    })

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Error creating user' })
  }
}

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await db('users').where({ email }).first()

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
      })
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
      })
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    })

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Error logging in' })
  }
}

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await db('users')
      .where({ id: req.user.userId })
      .select('id', 'username', 'email')
      .first()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({ error: 'Error fetching user' })
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
}
