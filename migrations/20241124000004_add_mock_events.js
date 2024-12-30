/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // First add notes column to events table
  await knex.schema.table('events', (table) => {
    table.text('notes')
  })

  // Get admin user's ID
  const adminUser = await knex('users').where('username', 'admin').first()

  if (!adminUser) {
    throw new Error('Admin user not found')
  }

  // Get category IDs
  const categories = await knex('event_categories').select('id', 'name')
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.name.toLowerCase()] = cat.id
    return acc
  }, {})

  // Helper function to format location
  const formatLocation = (location) => {
    if (!location) return null
    return `${location.name}, ${location.address}`
  }

  // Mock events data
  const events = [
    {
      title: 'Team Lunch Meeting',
      description: 'Monthly team lunch to discuss project progress',
      start_date: new Date(Date.now() + 86400000), // tomorrow
      end_date: new Date(Date.now() + 86400000 + 5400000), // 1.5 hours later
      location: formatLocation({
        name: 'Soul Bar & Bistro',
        address: 'Viaduct Harbour, Auckland',
      }),
      category_id: categoryMap['work'],
      user_id: adminUser.id,
      energy_level: 4,
      notes: 'Remember to discuss Q3 goals',
    },
    {
      title: 'Yoga Class',
      description: 'Weekly yoga session for stress relief',
      start_date: new Date(Date.now() + 172800000), // 2 days from now
      end_date: new Date(Date.now() + 172800000 + 3600000), // 1 hour later
      location: formatLocation({
        name: 'City Fitness',
        address: 'CBD, Auckland',
      }),
      category_id: categoryMap['exercise'],
      user_id: adminUser.id,
      energy_level: 5,
    },
    {
      title: 'Client Presentation',
      description: 'Final presentation for the mobile app project',
      start_date: new Date(Date.now() + 259200000), // 3 days from now
      end_date: new Date(Date.now() + 259200000 + 5400000), // 1.5 hours later
      location: formatLocation({
        name: 'Meeting Room 3',
        address: 'Level 15, PWC Tower',
      }),
      category_id: categoryMap['work'],
      user_id: adminUser.id,
      energy_level: 3,
      notes: 'Bring laptop and presentation materials',
    },
    {
      title: 'Birthday Dinner',
      description: "Sarah's birthday celebration",
      start_date: new Date(Date.now() + 432000000), // 5 days from now
      end_date: new Date(Date.now() + 432000000 + 10800000), // 3 hours later
      location: formatLocation({
        name: 'Amano',
        address: 'Hip Group House, Auckland',
      }),
      category_id: categoryMap['social'],
      user_id: adminUser.id,
      energy_level: 4,
      notes: 'Bring gift',
    },
  ]

  // Insert events
  return knex('events').insert(events)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Delete the mock events
  await knex('events')
    .whereIn('title', [
      'Team Lunch Meeting',
      'Yoga Class',
      'Client Presentation',
      'Birthday Dinner',
    ])
    .del()

  // Remove the notes column
  return knex.schema.table('events', (table) => {
    table.dropColumn('notes')
  })
}
