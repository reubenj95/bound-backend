const db = require('../db')

async function getAllPeople(req, res) {
  try {
    const people = await db('people')
      .select(
        'people.id',
        'people.name',
        'people.email',
        'people.notes',
        'people.created_at',
        'people.updated_at'
      )
      .orderBy('people.name', 'asc')

    // Get social circles for each person
    const peopleWithCircles = await Promise.all(
      people.map(async (person) => {
        const circles = await db('social_circle_members')
          .join(
            'social_circles',
            'social_circle_members.social_circle_id',
            'social_circles.id'
          )
          .where('social_circle_members.person_id', person.id)
          .select('social_circles.*')

        return {
          id: person.id,
          name: person.name,
          email: person.email || undefined,
          socialCircles: circles,
          notes: person.notes || undefined,
          createdAt: person.created_at,
          updatedAt: person.updated_at,
        }
      })
    )

    res.json(peopleWithCircles)
  } catch (error) {
    console.error('Error fetching people:', error)
    res.status(500).json({ message: 'Failed to fetch people' })
  }
}

async function getPersonById(req, res) {
  try {
    const person = await db('people')
      .select(
        'people.id',
        'people.name',
        'people.email',
        'people.notes',
        'people.created_at',
        'people.updated_at'
      )
      .where('people.id', req.params.id)
      .first()

    if (!person) {
      return res.status(404).json({ message: 'Person not found' })
    }

    // Get social circles for the person
    const circles = await db('social_circle_members')
      .join(
        'social_circles',
        'social_circle_members.social_circle_id',
        'social_circles.id'
      )
      .where('social_circle_members.person_id', person.id)
      .select('social_circles.*')

    const formattedPerson = {
      id: person.id,
      name: person.name,
      email: person.email || undefined,
      socialCircles: circles,
      notes: person.notes || undefined,
      createdAt: person.created_at,
      updatedAt: person.updated_at,
    }

    res.json(formattedPerson)
  } catch (error) {
    console.error('Error fetching person:', error)
    res.status(500).json({ message: 'Failed to fetch person' })
  }
}

async function createPerson(req, res) {
  const trx = await db.transaction()

  try {
    const { name, email, notes, socialCircles } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }

    // Create the person
    const [person] = await trx('people')
      .insert({
        name: name.trim(),
        email: email ? email.trim() : null,
        notes: notes ? notes.trim() : null,
      })
      .returning(['id', 'name', 'email', 'notes', 'created_at', 'updated_at'])

    // Add social circle memberships if provided
    if (socialCircles && socialCircles.length > 0) {
      const membershipRecords = socialCircles.map((circleId) => ({
        social_circle_id: circleId,
        person_id: person.id,
      }))

      await trx('social_circle_members').insert(membershipRecords)
    }

    // Get the social circles for the new person
    const circles = await trx('social_circle_members')
      .join(
        'social_circles',
        'social_circle_members.social_circle_id',
        'social_circles.id'
      )
      .where('social_circle_members.person_id', person.id)
      .select('social_circles.*')

    await trx.commit()

    const formattedPerson = {
      id: person.id,
      name: person.name,
      email: person.email || undefined,
      socialCircles: circles,
      notes: person.notes || undefined,
      createdAt: person.created_at,
      updatedAt: person.updated_at,
    }

    res.status(201).json(formattedPerson)
  } catch (error) {
    await trx.rollback()
    console.error('Error creating person:', error)
    res.status(500).json({ message: 'Failed to create person' })
  }
}

module.exports = {
  getAllPeople,
  getPersonById,
  createPerson,
}
