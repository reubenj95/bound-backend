/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return (
    knex.schema
      .createTable('social_circles', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name').notNullable()
        table.text('description')
        table.string('color', 7) // Hex color code
        table.string('icon')
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
      })
      .createTable('social_circle_members', (table) => {
        table
          .uuid('social_circle_id')
          .references('id')
          .inTable('social_circles')
          .onDelete('CASCADE')
        table
          .uuid('person_id')
          .references('id')
          .inTable('people')
          .onDelete('CASCADE')
        table.primary(['social_circle_id', 'person_id'])
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      })
      // Add some default social circles
      .then(() => {
        return knex('social_circles').insert([
          {
            name: 'Family',
            description: 'Close family members',
            color: '#FFE0E0',
          },
          {
            name: 'Friends',
            description: 'Close friends',
            color: '#E0FFE0',
          },
          {
            name: 'Work',
            description: 'Work colleagues',
            color: '#E0E0FF',
          },
          {
            name: 'Community',
            description: 'Community members and neighbors',
            color: '#FFE0FF',
          },
        ])
      })
  )
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('social_circle_members')
    .dropTableIfExists('social_circles')
}
