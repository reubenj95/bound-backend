/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('people').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'John Smith',
      email: 'john.smith@example.com',
      notes: 'Friend from work',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      notes: 'Yoga instructor',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Michael Chen',
      email: 'mchen@example.com',
      notes: 'College friend',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      notes: 'Book club member',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'David Brown',
      email: 'dbrown@example.com',
      notes: 'Running group',
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
  return knex('people')
    .whereIn('email', [
      'john.smith@example.com',
      'sarah.j@example.com',
      'mchen@example.com',
      'emma.w@example.com',
      'dbrown@example.com',
    ])
    .del()
}
