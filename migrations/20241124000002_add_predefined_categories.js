/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('event_categories').insert([
    {
      id: 'c0a80121-1234-4321-a123-4567890abcde', // SOCIAL
      name: 'Social',
      color: '#FF6B6B',
      icon: 'person.fill',
      energy_impact: 3,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 'c0a80121-2345-5432-b234-5678901bcdef', // WORK
      name: 'Work',
      color: '#4ECDC4',
      icon: 'briefcase.fill',
      energy_impact: -2,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 'c0a80121-3456-6543-c345-678901234567', // FAMILY
      name: 'Family',
      color: '#45B7D1',
      icon: 'house.fill',
      energy_impact: 2,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 'c0a80121-4567-7654-d456-789012345678', // HOBBY
      name: 'Hobby',
      color: '#96CEB4',
      icon: 'star.fill',
      energy_impact: 4,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 'c0a80121-5678-8765-e567-890123456789', // EXERCISE
      name: 'Exercise',
      color: '#FFEEAD',
      icon: 'sportscourt.fill',
      energy_impact: 3,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 'c0a80121-6789-9876-f678-901234567890', // HEALTH
      name: 'Health',
      color: '#D4A5A5',
      icon: 'heart.fill',
      energy_impact: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 'c0a80121-7890-0987-a789-012345678901', // OTHER
      name: 'Other',
      color: '#9FA8DA',
      icon: 'star.fill',
      energy_impact: 0,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ])
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('event_categories')
    .whereIn('name', [
      'Social',
      'Work',
      'Family',
      'Hobby',
      'Exercise',
      'Health',
      'Other',
    ])
    .del()
}
