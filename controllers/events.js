const db = require('../db')

// GET all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await db('events')
      .select(
        'events.*',
        db.raw(`
          COALESCE(
            json_agg(
              json_build_object(
                'id', people.id,
                'name', people.name,
                'email', people.email
              )
            ) FILTER (WHERE people.id IS NOT NULL),
            '[]'
          ) as attendees
        `)
      )
      .leftJoin(
        'event_participants',
        'events.id',
        'event_participants.event_id'
      )
      .leftJoin('people', 'event_participants.person_id', 'people.id')
      .groupBy('events.id')
      .orderBy('events.start_date', 'desc')

    res.json(events)
  } catch (error) {
    console.error('Error getting events:', error)
    res.status(500).json({ message: error.message })
  }
}

// GET single event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await db('events')
      .select(
        'events.*',
        db.raw(`
          COALESCE(
            json_agg(
              json_build_object(
                'id', people.id,
                'name', people.name,
                'email', people.email
              )
            ) FILTER (WHERE people.id IS NOT NULL),
            '[]'
          ) as attendees
        `)
      )
      .leftJoin(
        'event_participants',
        'events.id',
        'event_participants.event_id'
      )
      .leftJoin('people', 'event_participants.person_id', 'people.id')
      .where('events.id', req.params.id)
      .groupBy('events.id')
      .first()

    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }
    res.json(event)
  } catch (error) {
    console.error('Error getting event:', error)
    res.status(500).json({ message: error.message })
  }
}

// POST create new event
exports.createEvent = async (req, res) => {
  console.log('Received request body:', req.body)
  console.log('Received user:', req.user)

  const trx = await db.transaction()

  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error('Request body is empty')
    }

    const eventData = {
      title: req.body.title,
      description: req.body.description,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      location: req.body.location ? JSON.stringify(req.body.location) : null,
      category_id: req.body.category_id,
      user_id: req.user.userId,
    }

    console.log('Event data to insert:', eventData)

    // Only include energy_level if it's provided
    if (req.body.energy_level !== undefined) {
      eventData.energy_level = req.body.energy_level
    }

    // Only include feelings if provided
    if (req.body.feelings !== undefined) {
      eventData.feelings = JSON.stringify(req.body.feelings)
    }

    const [newEvent] = await trx('events').insert(eventData).returning('*')

    // Add attendees if provided
    if (req.body.attendees.length > 0 && Array.isArray(req.body.attendees)) {
      const attendeeRecords = req.body.attendees.map((personId) => ({
        event_id: newEvent.id,
        person_id: personId,
        status: 'attending',
      }))

      await trx('event_participants').insert(attendeeRecords)
    }

    await trx.commit()

    // Fetch the complete event with attendees
    const eventWithAttendees = await db('events')
      .select(
        'events.*',
        db.raw(`
          COALESCE(
            json_agg(
              json_build_object(
                'id', people.id,
                'name', people.name,
                'email', people.email
              )
            ) FILTER (WHERE people.id IS NOT NULL),
            '[]'
          ) as attendees
        `)
      )
      .leftJoin(
        'event_participants',
        'events.id',
        'event_participants.event_id'
      )
      .leftJoin('people', 'event_participants.person_id', 'people.id')
      .where('events.id', newEvent.id)
      .groupBy('events.id')
      .first()

    res.status(201).json(eventWithAttendees)
  } catch (error) {
    await trx.rollback()
    console.error('Error creating event:', error)
    res.status(400).json({ message: error.message })
  }
}

// PUT update event
exports.updateEvent = async (req, res) => {
  const trx = await db.transaction()

  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      location: req.body.location ? JSON.stringify(req.body.location) : null,
      category_id: req.body.category_id,
      user_id: req.user.userId,
      updated_at: db.fn.now(),
    }

    // Only include energy_level if it's provided
    if (req.body.energy_level !== undefined) {
      updateData.energy_level = req.body.energy_level
    }

    // Only include feelings if provided
    if (req.body.feelings !== undefined) {
      updateData.feelings = JSON.stringify(req.body.feelings)
    }

    const [updatedEvent] = await trx('events')
      .where({ id: req.params.id })
      .update(updateData)
      .returning('*')

    if (!updatedEvent) {
      await trx.rollback()
      return res.status(404).json({ message: 'Event not found' })
    }

    // Update attendees if provided
    if (req.body.attendees && Array.isArray(req.body.attendees)) {
      // Remove existing attendees
      await trx('event_participants').where({ event_id: req.params.id }).del()

      // Add new attendees
      const attendeeRecords = req.body.attendees.map((personId) => ({
        event_id: req.params.id,
        person_id: personId,
        status: 'attending',
      }))

      await trx('event_participants').insert(attendeeRecords)
    }

    await trx.commit()

    // Fetch the complete updated event with attendees
    const eventWithAttendees = await db('events')
      .select(
        'events.*',
        db.raw(`
          COALESCE(
            json_agg(
              json_build_object(
                'id', people.id,
                'name', people.name,
                'email', people.email
              )
            ) FILTER (WHERE people.id IS NOT NULL),
            '[]'
          ) as attendees
        `)
      )
      .leftJoin(
        'event_participants',
        'events.id',
        'event_participants.event_id'
      )
      .leftJoin('people', 'event_participants.person_id', 'people.id')
      .where('events.id', req.params.id)
      .groupBy('events.id')
      .first()

    res.json(eventWithAttendees)
  } catch (error) {
    await trx.rollback()
    console.error('Error updating event:', error)
    res.status(400).json({ message: error.message })
  }
}

// DELETE event
exports.deleteEvent = async (req, res) => {
  const trx = await db.transaction()

  try {
    // Delete event participants first
    await trx('event_participants').where({ event_id: req.params.id }).del()

    // Then delete the event
    const deleted = await trx('events').where({ id: req.params.id }).del()

    if (!deleted) {
      await trx.rollback()
      return res.status(404).json({ message: 'Event not found' })
    }

    await trx.commit()
    res.status(204).send()
  } catch (error) {
    await trx.rollback()
    console.error('Error deleting event:', error)
    res.status(500).json({ message: error.message })
  }
}
