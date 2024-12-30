const db = require('../db')

const getSocialCircles = async (req, res) => {
  try {
    const circles = await db('social_circles').select('*').orderBy('name')
    res.json(circles)
  } catch (error) {
    console.error('Error getting social circles:', error)
    res.status(500).json({ error: 'Failed to get social circles' })
  }
}

const getSocialCircle = async (req, res) => {
  const { id } = req.params
  try {
    const circle = await db('social_circles').select('*').where({ id }).first()

    if (!circle) {
      return res.status(404).json({ error: 'Social circle not found' })
    }

    // Get members
    const members = await db('social_circle_members')
      .select('person_id')
      .where({ social_circle_id: id })

    circle.members = members.map((m) => m.person_id)

    res.json(circle)
  } catch (error) {
    console.error('Error getting social circle:', error)
    res.status(500).json({ error: 'Failed to get social circle' })
  }
}

const createSocialCircle = async (req, res) => {
  const { name, description, color, icon } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Name is required' })
  }

  try {
    const [circle] = await db('social_circles')
      .insert({
        name,
        description,
        color,
        icon,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*')

    res.status(201).json(circle)
  } catch (error) {
    console.error('Error creating social circle:', error)
    res.status(500).json({ error: 'Failed to create social circle' })
  }
}

const updateSocialCircle = async (req, res) => {
  const { id } = req.params
  const { name, description, color, icon } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Name is required' })
  }

  try {
    const [circle] = await db('social_circles')
      .where({ id })
      .update({
        name,
        description,
        color,
        icon,
        updated_at: new Date(),
      })
      .returning('*')

    if (!circle) {
      return res.status(404).json({ error: 'Social circle not found' })
    }

    res.json(circle)
  } catch (error) {
    console.error('Error updating social circle:', error)
    res.status(500).json({ error: 'Failed to update social circle' })
  }
}

const deleteSocialCircle = async (req, res) => {
  const { id } = req.params
  try {
    // Delete members first due to foreign key constraint
    await db('social_circle_members').where({ social_circle_id: id }).delete()

    const deleted = await db('social_circles').where({ id }).delete()

    if (!deleted) {
      return res.status(404).json({ error: 'Social circle not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting social circle:', error)
    res.status(500).json({ error: 'Failed to delete social circle' })
  }
}

const addMember = async (req, res) => {
  const { id } = req.params
  const { personId } = req.body

  if (!personId) {
    return res.status(400).json({ error: 'Person ID is required' })
  }

  try {
    // Check if circle exists
    const circle = await db('social_circles').where({ id }).first()

    if (!circle) {
      return res.status(404).json({ error: 'Social circle not found' })
    }

    // Check if person exists
    const person = await db('people').where({ id: personId }).first()

    if (!person) {
      return res.status(404).json({ error: 'Person not found' })
    }

    // Add member
    await db('social_circle_members').insert({
      social_circle_id: id,
      person_id: personId,
    })

    res.status(201).send()
  } catch (error) {
    console.error('Error adding member to social circle:', error)
    res.status(500).json({ error: 'Failed to add member to social circle' })
  }
}

const removeMember = async (req, res) => {
  const { id, personId } = req.params

  try {
    const deleted = await db('social_circle_members')
      .where({
        social_circle_id: id,
        person_id: personId,
      })
      .delete()

    if (!deleted) {
      return res
        .status(404)
        .json({ error: 'Member not found in social circle' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error removing member from social circle:', error)
    res
      .status(500)
      .json({ error: 'Failed to remove member from social circle' })
  }
}

module.exports = {
  getSocialCircles,
  getSocialCircle,
  createSocialCircle,
  updateSocialCircle,
  deleteSocialCircle,
  addMember,
  removeMember,
}
